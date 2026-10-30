// Parity contract: the behavior every Headcode app (workos, www, blog, ...)
// must keep. Runs against a running app, local or deployed.
// Usage: pnpm parity [base-url] [--write]
//   --write adds a test entry, edits it, checks the site, and deletes it again.
//   It never publishes. Token: MCP_TOKEN or the first ALLOWED_MCP_TOKENS value.
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client'

const args = process.argv.slice(2)
const base = new URL(
  args.find((arg) => !arg.startsWith('--')) ?? 'http://draft.localhost:3000',
)
const write = args.includes('--write')
const token =
  process.env.MCP_TOKEN ?? process.env.ALLOWED_MCP_TOKENS?.split(',')[0]?.trim()
const mcp = new URL('/mcp', base)

const tools = {
  readOnly: [
    'headcode_get_version',
    'headcode_list_entries',
    'headcode_get_entry',
    'headcode_list_section_types',
    'headcode_list_images',
    'headcode_get_image_usage',
  ],
  write: [
    'headcode_add_entry',
    'headcode_rename_entry',
    'headcode_upload_image_from_url',
    'headcode_create_image_upload_url',
    'headcode_register_uploaded_image',
    'headcode_update_image_metadata',
    'headcode_update_section',
    'headcode_add_section',
    'headcode_duplicate_section',
    'headcode_reorder_sections',
    'headcode_new_draft',
  ],
  destructive: [
    'headcode_delete_entry',
    'headcode_delete_image',
    'headcode_delete_section',
    'headcode_publish',
  ],
}

type Entry = {
  _id: string
  slug: string
  name: string | null
  path: string | null
  description?: string
}
type ContentType = {
  kind: 'global' | 'collection'
  slug: string
  path: string | null
  description?: string
  sections: string[]
}
type Section = { _id: string; name: string; data: Record<string, unknown> }

const get = (path: string, init?: RequestInit) =>
  fetch(new URL(path, base), init)

const client = new Client(
  { name: 'headcode-parity', version: '1.0.0' },
  { versionNegotiation: { mode: { pin: '2026-07-28' } } },
)

const call = async <T,>(name: string, args: Record<string, unknown> = {}) => {
  const result = await client.callTool({ name, arguments: args })
  const text = result.content
    .map((item) => ('text' in item ? item.text : ''))
    .join('\n')
  assert.ok(!result.isError, `${name} failed: ${text}`)
  return JSON.parse(text) as T
}

before(async () => {
  assert.ok(token, 'Set MCP_TOKEN or ALLOWED_MCP_TOKENS.')
  await client.connect(
    new StreamableHTTPClientTransport(mcp, {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  )
})
after(() => client.close())

describe('MCP auth', () => {
  test('protected resource metadata names this host', async () => {
    const res = await get('/.well-known/oauth-protected-resource/mcp')
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.resource, mcp.href)
    assert.ok(body.authorization_servers?.length)
  })

  test('requests without a token get 401 with resource_metadata', async () => {
    const res = await get('/mcp', { method: 'POST', body: '{}' })
    assert.equal(res.status, 401)
    assert.match(
      res.headers.get('www-authenticate') ?? '',
      /resource_metadata=/,
    )
  })

  test('foreign origins get 403', async () => {
    const res = await get('/mcp', {
      method: 'POST',
      body: '{}',
      headers: {
        Authorization: `Bearer ${token}`,
        Origin: 'https://evil.example',
        'Content-Type': 'application/json',
      },
    })
    assert.equal(res.status, 403)
  })
})

describe('MCP tools', () => {
  test('protocol 2026-07-28 (stateless, modern era)', () => {
    assert.equal(client.getProtocolEra(), 'modern')
  })

  test('tool list and annotations', async () => {
    const listed = (await client.listTools()).tools
    assert.deepEqual(
      listed.map((tool) => tool.name).sort(),
      Object.values(tools).flat().sort(),
    )
    for (const tool of listed) {
      const { readOnlyHint, destructiveHint } = tool.annotations ?? {}
      assert.equal(readOnlyHint, tools.readOnly.includes(tool.name), tool.name)
      assert.equal(
        destructiveHint,
        tools.destructive.includes(tool.name),
        tool.name,
      )
    }
  })

  test('publish and new draft need an explicit request', async () => {
    const listed = (await client.listTools()).tools
    for (const name of ['headcode_publish', 'headcode_new_draft'])
      assert.match(
        listed.find((tool) => tool.name === name)?.description ?? '',
        /explicitly/,
      )
  })

  test('version follows the host', async () => {
    const { version, status } = await call<{
      version: string
      status: Record<string, { _id: string } | null>
    }>('headcode_get_version')
    assert.ok(version === 'live' || version === 'draft')
    assert.ok(status[version]?._id)
  })

  test('every global loads with sections', async () => {
    const { globals } = await call<{ globals: Entry[] }>(
      'headcode_list_entries',
    )
    assert.ok(globals.length)
    for (const { slug } of globals) {
      const { sections } = await call<{ sections: Section[] }>(
        'headcode_get_entry',
        { slug },
      )
      assert.ok(Array.isArray(sections), slug)
    }
  })

  test('entries explain the site structure', async () => {
    const { contentTypes, globals } = await call<{
      contentTypes: ContentType[]
      globals: Entry[]
    }>('headcode_list_entries')
    assert.ok(contentTypes.some((type) => type.kind === 'collection'))
    for (const type of contentTypes) {
      assert.ok(type.description, type.slug)
      assert.ok(type.sections.length, type.slug)
    }
    assert.ok(
      globals.some((entry) => entry.path === '/'),
      'No homepage.',
    )
    for (const entry of globals) assert.ok(entry.description, entry.slug)
  })

  test('section types load for a collection without an entry', async () => {
    const { contentTypes } = await call<{ contentTypes: ContentType[] }>(
      'headcode_list_entries',
    )
    for (const { kind, slug } of contentTypes) {
      if (kind !== 'collection') continue
      const { sections } = await call<{
        sections: { name: string; description?: string }[]
      }>('headcode_list_section_types', { slug })
      assert.ok(sections.length, slug)
      for (const section of sections)
        assert.ok(section.description, section.name)
    }
  })
})

describe('Site', () => {
  for (const [path, type] of [
    ['/', 'text/html'],
    ['/?md', 'text/markdown'],
    ['/llms.txt', 'text/markdown'],
    ['/sitemap.xml', 'application/xml'],
    ['/robots.txt', 'text/plain'],
  ])
    test(`${path} is ${type}`, async () => {
      const res = await get(path)
      assert.equal(res.status, 200)
      assert.match(res.headers.get('content-type') ?? '', new RegExp(type))
    })

  test('Accept: text/markdown returns Markdown', async () => {
    const res = await get('/', { headers: { Accept: 'text/markdown' } })
    assert.match(res.headers.get('content-type') ?? '', /text\/markdown/)
  })

  test('the homepage has canonical, Open Graph and JSON-LD', async () => {
    const html = await (await get('/')).text()
    assert.match(html, /<link rel="canonical"/)
    assert.match(html, /<meta property="og:title"/)
    assert.match(html, /<script type="application\/ld\+json">/)
  })

  test('draft hosts are not indexed, live hosts are', async () => {
    const { version } = await call<{ version: string }>('headcode_get_version')
    const html = await (await get('/')).text()
    const robots = await (await get('/robots.txt')).text()
    if (version === 'draft') {
      assert.match(html, /<meta name="robots" content="noindex/)
      assert.match(robots, /Disallow: \/\s*$/m)
    } else {
      assert.doesNotMatch(html, /<meta name="robots" content="noindex/)
      assert.match(robots, /Sitemap: /)
    }
  })

  for (const path of ['/live', '/draft'])
    test(`${path} is not reachable directly`, async () => {
      assert.equal((await get(path)).status, 404)
    })
})

describe('Write cycle (--write)', { skip: !write }, () => {
  let entry: Entry
  let path = ''
  let section: Section
  let field = ''
  let deleted = false
  const marker = `Parity ${Date.now()}`

  // Clean up when a step fails half way.
  after(async () => {
    if (entry && !deleted)
      await call('headcode_delete_entry', { entryId: entry._id })
  })

  test('add a collection entry', async () => {
    const list = () =>
      call<{ contentTypes: ContentType[]; collections: Entry[] }>(
        'headcode_list_entries',
      )
    const slug = (await list()).contentTypes.find(
      (type) => type.kind === 'collection',
    )?.slug
    ;({ entry } = await call<{ entry: Entry }>('headcode_add_entry', {
      slug,
      name: marker,
    }))
    path =
      (await list()).collections.find((item) => item._id === entry._id)?.path ??
      ''
    assert.ok(path, 'The new entry has no site path.')
  })

  test('the site renders its default content', async () => {
    const res = await get(`${path}?md`)
    assert.equal(res.status, 200)
    const md = await res.text()
    // Pick a text field whose default value is visible in the Markdown.
    const { sections } = await call<{ sections: Section[] }>(
      'headcode_get_entry',
      { entryId: entry._id },
    )
    for (const candidate of sections)
      for (const [key, value] of Object.entries(candidate.data))
        if (
          !field &&
          typeof value === 'string' &&
          value &&
          md.includes(value)
        ) {
          section = candidate
          field = key
        }
    assert.ok(field, 'No section text found in the Markdown.')
  })

  test('a section update shows on the site at once', async () => {
    await call('headcode_update_section', {
      sectionId: section._id,
      data: { [field]: marker },
    })
    assert.match(await (await get(`${path}?md`)).text(), new RegExp(marker))
    assert.match(await (await get(path)).text(), new RegExp(marker))
  })

  test('delete the entry', async () => {
    await call('headcode_delete_entry', { entryId: entry._id })
    deleted = true
    assert.equal((await get(`${path}?md`)).status, 404)
  })
})

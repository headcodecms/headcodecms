// Parity contract: the behavior every Headcode app (vercel, www, blog, ...)
// must keep. Runs against a running app, local or deployed.
// Usage: pnpm parity [base-url] [--write] [--admin] [--login] [--compare=<url>]
//   --write adds a test entry, edits it, checks the site, and deletes it again.
//   It never publishes. Token: MCP_TOKEN (also from .parity/<host>.env) or the
//   first ALLOWED_MCP_TOKENS value (.env.local).
//   --login opens Chrome once; a human signs in, the session is saved in
//   .parity/<host>.json (gitignored, a secret). Then exits.
//   --admin tests the admin with that session in headless Chrome: stock
//   theme, entries load; with --write also an edit in the admin.
//   --compare=<url> compares every page in the sitemap with the same path on
//   the original site (before the convert): text, title, description, and
//   screenshots at 1440px and 390px. Failed screenshots go to .parity/compare.
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { after, before, describe, test } from 'node:test'
import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client'
import { chromium, type Browser, type Page } from 'playwright-core'

// The app's dev server: the port of `--port` in the dev script, else 3000.
const devPort =
  /--port[ =](\d+)/.exec(
    JSON.parse(readFileSync('package.json', 'utf8')).scripts?.dev ?? '',
  )?.[1] ?? '3000'

const args = process.argv.slice(2)
const base = new URL(
  args.find((arg) => !arg.startsWith('--')) ??
    `http://draft.localhost:${devPort}`,
)
const write = args.includes('--write')
const original = args
  .find((arg) => arg.startsWith('--compare='))
  ?.slice('--compare='.length)
const admin = args.includes('--admin')
// A deployed host keeps its shared MCP token in .parity/<host>.env (gitignored).
if (existsSync(`.parity/${base.host}.env`))
  process.loadEnvFile(`.parity/${base.host}.env`)
const token =
  process.env.MCP_TOKEN ?? process.env.ALLOWED_MCP_TOKENS?.split(',')[0]?.trim()
const mcp = new URL('/mcp', base)
const session = `.parity/${base.host}.json`
const adminCss = readFileSync('app/(admin)/admin.css', 'utf8')

// Admin pages are done loading when no "Loading ..." state is left.
const waitForAdmin = (page: Page, timeout = 20_000) =>
  page.waitForFunction(
    () =>
      location.pathname.startsWith('/admin') &&
      !!document.querySelector('header') &&
      !/Loading /.test(document.body.innerText),
    undefined,
    { timeout },
  )

if (args.includes('--login')) {
  const browser = await chromium.launch({ channel: 'chrome', headless: false })
  const page = await browser.newPage()
  await page.goto(new URL('/admin', base).href)
  console.log(`Sign in to ${base.host} in the browser window (5 minutes).`)
  await page.waitForURL(
    (url) =>
      url.host === base.host &&
      url.pathname.startsWith('/admin') &&
      !url.pathname.startsWith('/admin/login'),
    { timeout: 300_000 },
  )
  await waitForAdmin(page)
  mkdirSync('.parity', { recursive: true })
  await page.context().storageState({ path: session })
  await browser.close()
  console.log(`Saved the session in ${session}.`)
  process.exit(0)
}

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
    const body = (await res.json()) as {
      resource?: string
      authorization_servers?: string[]
    }
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

describe('Admin', () => {
  // Hosted sign-in (AuthKit) must call back to this host; an own sign-in
  // page (Better Auth) must be on this host.
  test('/admin without a session redirects to sign-in for this host', async () => {
    const res = await get('/admin', { redirect: 'manual' })
    assert.equal(res.status, 307)
    const location = new URL(res.headers.get('location') ?? '', base)
    if (location.origin === base.origin)
      assert.match(location.pathname, /^\/admin\/login/)
    else
      assert.equal(
        location.searchParams.get('redirect_uri'),
        new URL('/callback', base).href,
      )
  })

  test('admin.css has its own theme and imports nothing from the site', () => {
    assert.doesNotMatch(adminCss, /@import ['"]\./)
    assert.match(adminCss, /\.dark \{[^}]*--background:/)
  })
})

describe('Admin signed in (--admin)', { skip: !admin }, () => {
  let browser: Browser
  let page: Page

  before(async () => {
    assert.ok(
      existsSync(session),
      `No admin session. Run: pnpm parity ${base.origin} --login`,
    )
    browser = await chromium.launch({ channel: 'chrome' })
    page = await browser.newPage({
      storageState: session,
      viewport: { width: 1440, height: 900 },
    })
  })
  after(() => browser?.close())

  test('entries load', async () => {
    await page.goto(new URL('/admin', base).href)
    assert.equal(
      new URL(page.url()).host,
      base.host,
      'Session expired? Run --login.',
    )
    await waitForAdmin(page)
    const { globals } = await call<{ globals: Entry[] }>(
      'headcode_list_entries',
    )
    const text = await page.locator('main').innerText()
    for (const { slug } of globals)
      assert.match(text, new RegExp(`/${slug}\\b`))
  })

  test('the admin uses the stock Headcode theme', async () => {
    const background = (selector: string) =>
      adminCss
        .match(new RegExp(`${selector} \\{([^}]*)\\}`))?.[1]
        .match(/--background:\s*([^;]+);/)?.[1]
        .trim()
    // Compare as RGB pixels: the served CSS may use another color space.
    const style = await page.evaluate(
      ({ light, dark }) => {
        const context = document.createElement('canvas').getContext('2d')!
        const rgb = (color: string) => {
          context.fillStyle = color
          context.fillRect(0, 0, 1, 1)
          return [...context.getImageData(0, 0, 1, 1).data].join(',')
        }
        const html = document.documentElement
        return {
          font: getComputedStyle(document.body).fontFamily,
          actual: rgb(getComputedStyle(document.body).backgroundColor),
          expected: rgb((html.classList.contains('dark') ? dark : light) ?? ''),
        }
      },
      { light: background(':root'), dark: background('\\.dark') },
    )
    assert.match(style.font, /Inter/)
    assert.equal(style.actual, style.expected)
    await page.screenshot({ path: `.parity/admin-${base.host}.png` })
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

  test(
    'an admin edit shows on the site (--admin)',
    { skip: !admin },
    async () => {
      const edited = `${marker} admin`
      const browser = await chromium.launch({ channel: 'chrome' })
      try {
        const page = await browser.newPage({ storageState: session })
        await page.goto(new URL(`/admin/entries/${entry._id}`, base).href)
        await waitForAdmin(page)
        await page
          .locator(`#admin-section-${section._id} button:not([aria-label])`)
          .click()
        // The section editor opens; fill the field that holds the marker.
        await page.waitForFunction(
          (value) =>
            [...document.querySelectorAll('input, textarea')].some(
              (item) => (item as HTMLInputElement).value === value,
            ),
          marker,
        )
        const inputs = page.locator('input, textarea')
        const values = await inputs.evaluateAll((items) =>
          items.map((item) => (item as HTMLInputElement).value),
        )
        await inputs.nth(values.indexOf(marker)).fill(edited)
        await page.getByRole('button', { name: 'Save', exact: true }).click()
        // Saved and revalidated: the site shows the edit.
        for (let i = 0; i < 20; i++) {
          if ((await (await get(`${path}?md`)).text()).includes(edited)) break
          await page.waitForTimeout(500)
        }
      } finally {
        await browser.close()
      }
      assert.match(await (await get(`${path}?md`)).text(), new RegExp(edited))
    },
  )

  test('delete the entry', async () => {
    await call('headcode_delete_entry', { entryId: entry._id })
    deleted = true
    assert.equal((await get(`${path}?md`)).status, 404)
  })
})

// Paths of every page, from the sitemap of the converted site.
const pagePaths = original
  ? [
      ...(await (await get('/sitemap.xml')).text()).matchAll(
        /<loc>([^<]+)<\/loc>/g,
      ),
    ].map(([, loc]) => new URL(loc).pathname)
  : []

describe('Compare with the original (--compare)', { skip: !original }, () => {
  let browser: Browser

  before(async () => {
    browser = await chromium.launch({ channel: 'chrome' })
  })
  after(() => browser?.close())

  const open = async (site: string, path: string, width = 1440) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    await page.goto(new URL(path, site).href, { waitUntil: 'networkidle' })
    await page.addStyleTag({
      content:
        '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}',
    })
    return page
  }

  const read = async (site: string, path: string) => {
    const page = await open(site, path)
    const result = {
      title: await page.title(),
      description: await page
        .locator('meta[name="description"]')
        .getAttribute('content'),
      text: (await page.locator('body').innerText())
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }
    await page.close()
    return result
  }

  const shot = async (site: string, path: string, width: number) => {
    const page = await open(site, path, width)
    await page.waitForTimeout(300)
    const png = await page.screenshot({ fullPage: true })
    await page.close()
    return png
  }

  // Share of pixels that differ; a height difference counts as different.
  const pixelDiff = async (a: Buffer, b: Buffer) => {
    const page = await browser.newPage()
    const ratio = await page.evaluate(
      async (sources) => {
        const images = await Promise.all(
          sources.map(async (src) => {
            const image = new Image()
            image.src = src
            await image.decode()
            return image
          }),
        )
        const width = Math.max(...images.map((image) => image.width))
        const height = Math.max(...images.map((image) => image.height))
        const [x, y] = images.map((image) => {
          const context = new OffscreenCanvas(width, height).getContext('2d')!
          context.drawImage(image, 0, 0)
          return context.getImageData(0, 0, width, height).data
        })
        let diff = 0
        for (let i = 0; i < x.length; i += 4)
          if (
            Math.abs(x[i] - y[i]) +
              Math.abs(x[i + 1] - y[i + 1]) +
              Math.abs(x[i + 2] - y[i + 2]) +
              Math.abs(x[i + 3] - y[i + 3]) >
            24
          )
            diff++
        return diff / (width * height)
      },
      [a, b].map((png) => `data:image/png;base64,${png.toString('base64')}`),
    )
    await page.close()
    return ratio
  }

  for (const path of pagePaths)
    test(path, async () => {
      const [before, after] = [
        await read(original!, path),
        await read(base.href, path),
      ]
      assert.deepEqual(after.text, before.text, 'Text differs')
      assert.equal(after.title, before.title, 'Title differs')
      assert.equal(after.description, before.description, 'Description differs')
      for (const width of [1440, 390]) {
        const [a, b] = [
          await shot(original!, path, width),
          await shot(base.href, path, width),
        ]
        const ratio = await pixelDiff(a, b)
        if (ratio >= 0.001) {
          const name = `.parity/compare/${width}${path.replace(/\//g, '_')}`
          mkdirSync('.parity/compare', { recursive: true })
          writeFileSync(`${name}-original.png`, a)
          writeFileSync(`${name}-converted.png`, b)
        }
        assert.ok(
          ratio < 0.001,
          `${(ratio * 100).toFixed(3)}% of the pixels differ at ${width}px`,
        )
      }
    })
})

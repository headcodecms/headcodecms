// End-to-end check of an MCP URL, the way an MCP client connects:
// 401 challenge -> resource metadata -> auth server metadata -> client
// registration (DCR) -> sign-in -> authorize -> consent -> token -> tools.
//
//   node scripts/smoke.mjs [mcp-url]
//
// SMOKE_EMAIL / SMOKE_PASSWORD: the account to sign in with (created if
// sign-up is open). Defaults are for local development only.
import { createHash, randomBytes } from 'node:crypto'

const mcpUrl = process.argv[2] ?? 'http://localhost:3080/p/demo/mcp'
const email = process.env.SMOKE_EMAIL ?? 'smoke@headcode.local'
const password = process.env.SMOKE_PASSWORD ?? 'smoke-password-local'
const redirectUri = 'http://127.0.0.1:9999/callback'

const timings = {}
const step = async (name, fn) => {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    timings[name] = Math.round(performance.now() - start)
  }
}
const check = (ok, message) => {
  if (!ok) throw new Error(message)
  console.log(`ok  ${message}`)
}
const b64url = (buffer) => buffer.toString('base64url')
const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString())

// 1. Without a token: 401 with RFC 9728 resource metadata.
const challenge = await step('challenge', () =>
  fetch(mcpUrl, { method: 'POST', body: '{}' }),
)
// Without WWW-Authenticate, MCP clients fall back to the well-known URL
// (RFC 9728 path insertion), as this check does.
const wwwAuthenticate = challenge.headers.get('www-authenticate')
const { origin, pathname } = new URL(mcpUrl)
const metadataUrl =
  wwwAuthenticate?.match(/resource_metadata="([^"]+)"/)?.[1] ??
  `${origin}/.well-known/oauth-protected-resource${pathname}`
check(
  challenge.status === 401,
  `401 (${wwwAuthenticate ? 'with resource_metadata' : 'WWW-Authenticate missing, well-known fallback'})`,
)

const resource = await step('resource metadata', () =>
  fetch(metadataUrl).then((r) => r.json()),
)
check(resource.resource === mcpUrl, `resource is ${mcpUrl}`)
const issuer = new URL(resource.authorization_servers[0])
const server = await step('auth server metadata', () =>
  fetch(
    `${issuer.origin}/.well-known/oauth-authorization-server${issuer.pathname}`,
  ).then((r) => r.json()),
)
check(server.issuer === issuer.href, `issuer ${server.issuer}`)

// 2. Register a public client (DCR).
const client = await step('register', () =>
  fetch(server.registration_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_name: 'Headcode smoke test',
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    }),
  }).then((r) => r.json()),
)
check(client.client_id, 'client registered')

// 3. Sign in (or sign up) to get a session cookie.
const authBase = issuer.href.replace(/\/$/, '')
const post = (path, body) =>
  fetch(`${authBase}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: issuer.origin },
    body: JSON.stringify(body),
  })
let session = await step('sign-in', () =>
  post('/sign-in/email', { email, password }),
)
if (!session.ok)
  session = await step('sign-up', () =>
    post('/sign-up/email', { email, password, name: email }),
  )
const cookie = session.headers
  .getSetCookie()
  .map((c) => c.split(';')[0])
  .join('; ')
check(session.ok && cookie, `signed in as ${email}`)

// 4. Authorize with PKCE, accept consent, exchange the code.
const verifier = b64url(randomBytes(32))
const authorize = new URL(server.authorization_endpoint)
authorize.search = new URLSearchParams({
  response_type: 'code',
  client_id: client.client_id,
  redirect_uri: redirectUri,
  scope: 'openid profile offline_access',
  state: 'smoke',
  code_challenge: b64url(createHash('sha256').update(verifier).digest()),
  code_challenge_method: 'S256',
  resource: mcpUrl,
})
let location = await step('authorize', () =>
  fetch(authorize, { headers: { cookie }, redirect: 'manual' }).then(
    // Better Auth answers fetch requests with { redirect, url } instead of 302.
    async (r) => r.headers.get('location') ?? (await r.json()).url,
  ),
)
if (location && new URL(location, issuer).pathname === '/consent') {
  const consent = await step('consent', () =>
    fetch(`${authBase}/oauth2/consent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: issuer.origin,
        cookie,
      },
      body: JSON.stringify({
        accept: true,
        oauth_query: new URL(location, issuer).search.slice(1),
      }),
    }).then((r) => r.json()),
  )
  location = consent.url
}
const code = location && new URL(location).searchParams.get('code')
if (!code) console.log('redirect:', location)
check(code, 'authorization code')

const token = await step('token', () =>
  fetch(server.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: client.client_id,
      code_verifier: verifier,
      resource: mcpUrl,
    }),
  }).then((r) => r.json()),
)
const [header, payload] = (token.access_token ?? '').split('.')
check(
  header &&
    decode(header).typ === 'at+jwt' &&
    [decode(payload).aud].flat().includes(mcpUrl),
  `JWT access token (${decode(header).alg}) for ${decode(payload).aud}`,
)

// 5. MCP tools with the token.
let id = 0
const rpc = (url, method, params) =>
  fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token.access_token}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }),
  })
const call = async (name, args) => {
  const response = await step(`tools/call ${name}`, () =>
    rpc(mcpUrl, 'tools/call', { name, arguments: args }).then((r) => r.json()),
  )
  if (response.error || response.result?.isError)
    throw new Error(JSON.stringify(response))
  return response.result.structuredContent
}

const init = await step('initialize', () =>
  rpc(mcpUrl, 'initialize', {
    protocolVersion: '2025-11-25',
    capabilities: {},
    clientInfo: { name: 'smoke', version: '1' },
  }).then((r) => r.json()),
)
check(init.result?.serverInfo, `initialize: ${init.result?.serverInfo?.name}`)
const tools = await step('tools/list', () =>
  rpc(mcpUrl, 'tools/list', {}).then((r) => r.json()),
)
check(
  tools.result?.tools?.length === 3,
  `tools: ${tools.result?.tools?.map((t) => t.name).join(', ')}`,
)
const live = await call('entries_list', { version: 'live' })
check(live.entries.length > 0, `live has ${live.entries.length} page(s)`)
const stamp = new Date().toISOString()
await call('entry_update', {
  path: '/smoke',
  version: 'draft',
  data: { title: 'Smoke', stamp },
})
const draft = await call('entry_get', { path: '/smoke', version: 'draft' })
check(draft.data.stamp === stamp, 'draft write and read back')
const liveSmoke = await rpc(mcpUrl, 'tools/call', {
  name: 'entry_get',
  arguments: { path: '/smoke', version: 'live' },
}).then((r) => r.json())
check(
  liveSmoke.error || liveSmoke.result?.isError,
  'draft write did not touch live',
)

// 6. The token is bound to this project's URL.
const other = mcpUrl.replace(/\/p\/[^/]+\/mcp$/, '/p/other/mcp')
const wrongAudience = await rpc(other, 'tools/list', {})
check(wrongAudience.status === 401, 'token rejected for another project')

console.log('\ntimings (ms):', timings)

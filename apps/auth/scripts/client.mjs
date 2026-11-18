// Adds a site as a first-party OAuth client: public (PKCE, no secret) and
// without a consent page. Prints the client id for the site's
// HEADCODE_CLIENT_ID.
//
//   pnpm client <name> <redirect-uri> [<redirect-uri> ...]
import { auth } from '../lib/auth.ts'

const [name, ...redirectUris] = process.argv.slice(2)
if (!name || !redirectUris.length) {
  console.error('usage: pnpm client <name> <redirect-uri> [<redirect-uri> ...]')
  process.exit(1)
}

// Registered like an MCP client (dynamic client registration), which cannot
// skip consent; a first-party site may, so that is set afterwards.
const client = await auth.api.registerOAuthClient({
  headers: new Headers(),
  body: {
    client_name: name,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
  },
})
const { adapter } = await auth.$context
await adapter.update({
  model: 'oauthClient',
  where: [{ field: 'clientId', value: client.client_id }],
  update: { skipConsent: true },
})
console.log(client.client_id)
process.exit(0)

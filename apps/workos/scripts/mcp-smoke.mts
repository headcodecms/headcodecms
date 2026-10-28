// Smoke test for the MCP endpoint, pinned to spec 2026-07-28.
// Usage: pnpm mcp [url] [tool] [json-args]
import {
  Client,
  StreamableHTTPClientTransport,
} from '@modelcontextprotocol/client'

const [url = 'http://localhost:3000/mcp', tool, args = '{}'] =
  process.argv.slice(2)
const token = process.env.ALLOWED_MCP_TOKENS?.split(',')[0]?.trim()

const client = new Client(
  { name: 'headcode-smoke', version: '1.0.0' },
  { versionNegotiation: { mode: { pin: '2026-07-28' } } },
)
await client.connect(
  new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  }),
)

if (tool) {
  const result = await client.callTool({
    name: tool,
    arguments: JSON.parse(args),
  })
  console.log(
    result.content
      .map((item) => ('text' in item ? item.text : item))
      .join('\n'),
  )
} else {
  console.log(`era: ${client.getProtocolEra()}`)
  console.log(
    (await client.listTools()).tools.map((item) => item.name).join('\n'),
  )
}
await client.close()

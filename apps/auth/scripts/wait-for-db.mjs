// `pnpm dev` starts the backend and this app together; the backend starts
// embedded Postgres (the first run downloads it). Wait until the database
// accepts connections, so `pnpm migrate` can create the auth tables.
import pg from 'pg'

const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  'postgresql://postgres:headcode@localhost:54329/headcode'
const deadline = Date.now() + 5 * 60_000

for (;;) {
  const client = new pg.Client({ connectionString: url })
  try {
    await client.connect()
    await client.end()
    break
  } catch (error) {
    if (Date.now() > deadline) throw error
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

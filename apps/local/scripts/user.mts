// Manages admin accounts in the local database, without a browser or mail:
//   pnpm user list
//   pnpm user role <email> <editor|viewer>
//   pnpm user password <email>      sets and prints a new random password
// DATABASE_URL, default file:storage/headcode.db.
import { randomBytes } from 'node:crypto'
import { createClient } from '@libsql/client'
import { hashPassword } from 'better-auth/crypto'

const db = createClient({
  url: process.env.DATABASE_URL ?? 'file:storage/headcode.db',
})
const [command, email, value] = process.argv.slice(2)

const user = async () => {
  const { rows } = await db.execute({
    sql: 'SELECT id FROM user WHERE email = ?',
    args: [email ?? ''],
  })
  if (!rows[0]) throw new Error(`No account with email ${email}.`)
  return String(rows[0].id)
}

if (command === 'list') {
  const { rows } = await db.execute(
    'SELECT email, headcode_role, created_at FROM user ORDER BY created_at',
  )
  for (const row of rows)
    console.log(
      `${row.email}  ${row.headcode_role}  ${new Date(Number(row.created_at)).toISOString().slice(0, 10)}`,
    )
  if (!rows.length)
    console.log('No accounts yet. The first sign-up becomes the editor.')
} else if (command === 'role' && (value === 'editor' || value === 'viewer')) {
  await db.execute({
    sql: 'UPDATE user SET headcode_role = ? WHERE id = ?',
    args: [value, await user()],
  })
  console.log(`${email} is now ${value} (applies at the next sign-in).`)
} else if (command === 'password') {
  const id = await user()
  const password = randomBytes(12).toString('base64url')
  const { rowsAffected } = await db.execute({
    sql: "UPDATE account SET password = ? WHERE user_id = ? AND provider_id = 'credential'",
    args: [await hashPassword(password), id],
  })
  if (!rowsAffected) throw new Error(`${email} has no password sign-in.`)
  // Old sessions end, so the new password is the only way in.
  await db.execute({ sql: 'DELETE FROM session WHERE user_id = ?', args: [id] })
  console.log(`New password for ${email}: ${password}`)
} else {
  console.log(
    'Usage: pnpm user list | role <email> <editor|viewer> | password <email>',
  )
  process.exit(1)
}

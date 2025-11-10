import { count, eq } from 'drizzle-orm'
import { db } from './db'
import { AddRole, Role, roles } from './schema'

const DBError = (error: unknown) => {
  console.error(error)
  return new Error(
    `DB_ERROR: ${error instanceof Error ? error.message : error}`,
  )
}

export async function getRolesCount(): Promise<number> {
  try {
    const result = await db.select({ count: count() }).from(roles)
    return result[0].count
  } catch (error) {
    throw DBError(error)
  }
}

export async function getRole(email: string): Promise<Role | undefined> {
  try {
    const result = await db.select().from(roles).where(eq(roles.email, email))
    if (result.length === 0) {
      return undefined
    }
    return result[0]
  } catch (error) {
    throw DBError(error)
  }
}

export async function addRole(role: AddRole) {
  try {
    await db.insert(roles).values(role)
  } catch (error) {
    throw DBError(error)
  }
}

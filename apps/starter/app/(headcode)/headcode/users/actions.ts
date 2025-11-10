'use server'

import { addRole as addDBRole } from '@/db'
import { AddRole, Role } from '@/db/schema'
import { requireRole } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

export async function addRole(role: AddRole) {
  requireRole(['admin'], true)
  await addDBRole(role)
  revalidateTag('/headcode/users', 'max')

  return { success: true }
}

export async function deleteUser(id: number) {
  console.log('deleting user', id)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  revalidateTag('/headcode/users', 'max')

  return { success: true }
}

export async function getRoles(): Promise<Role[]> {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return [
    {
      id: 1,
      email: 'matthew@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      email: 'jane@example.com',
      role: 'editor',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 3,
      email: 'john@example.com',
      role: 'editor',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 4,
      email: 'jane@example.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]
}

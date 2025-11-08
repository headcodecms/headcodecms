'use server'

import { AddRole } from '@/db/schema'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function addRole(role: AddRole) {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  revalidateTag('/headcode/users', 'max')

  return { success: true }
}

export async function deleteUser(id: string) {
  console.log('deleting user', id)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  revalidatePath('/headcode/users')

  return { success: true }
}

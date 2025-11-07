'use server'

import { revalidatePath } from 'next/cache'

export async function addUser(values: unknown) {
  console.log(values)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  revalidatePath('/headcode/users')

  return {
    id: '1',
    email: 'matthew@example.com',
    role: 'admin',
  }
}

export async function deleteUser(id: string) {
  console.log('deleting user', id)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  revalidatePath('/headcode/users')

  return { success: true }
}

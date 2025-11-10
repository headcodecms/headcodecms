'use server'

import { auth } from '@/lib/auth'
import { type Role } from '@/db'
import { revalidateTag } from 'next/cache'

export async function createInitialUser({
  email,
  password,
  role,
}: {
  email: string
  password: string
  role: Role
}) {
  await auth.api.createUser({
    body: {
      email,
      password,
      name: email,
      role,
    },
  })

  revalidateTag('/headcode/users', 'max')

  return { success: true }
}

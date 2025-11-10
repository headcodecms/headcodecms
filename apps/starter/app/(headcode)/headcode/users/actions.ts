'use server'

import { auth, UserRole } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

export async function createInitialUser({
  email,
  password,
  role,
}: {
  email: string
  password: string
  role: UserRole
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

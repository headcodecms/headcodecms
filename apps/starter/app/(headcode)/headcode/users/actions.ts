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
  try {
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
  } catch (error) {
    console.error('Error creating initial user', error)
    return {
      success: false,
      error: (error as Error).message ?? 'Error creating initial user',
    }
  }
}

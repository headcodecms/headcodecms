'use server'

import { type Role } from '@/db'
import { auth } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

export async function createInitialUser({
  email,
  password,
  role,
}: {
  email: string
  password: string
  role: Role
}): Promise<{ success?: boolean; error?: string }> {
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
      error: (error as Error).message ?? 'Error creating initial user',
    }
  }
}

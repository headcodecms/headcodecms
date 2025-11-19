'use server'

import type { Role } from '@/lib/headcode/types'
import { auth } from '@/lib/auth'

export async function addUser({
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

    return { success: true }
  } catch (error) {
    console.error('Error creating initial user', error)
    return {
      error: (error as Error).message ?? 'Error creating initial user',
    }
  }
}

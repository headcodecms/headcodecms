'use server'

import { type Role } from '@/db'
import { auth } from '@/lib/auth'
import { refresh } from 'next/cache'

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

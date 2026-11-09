'use client'

import { HeadcodeError } from '@/headcode/authorization'
import * as React from 'react'

// HeadcodeError data is the user-facing message.
export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof HeadcodeError
    ? error.data
    : error instanceof Error
      ? error.message
      : fallback

// Runs async actions, tracking which are pending and the last error message.
export const useActions = <T extends string>() => {
  const [pending, setPending] = React.useState<T[]>([])
  const [error, setError] = React.useState<string | null>(null)

  const run = async (
    action: T,
    fn: () => Promise<unknown>,
    fallbackError: string,
  ) => {
    setPending((current) => [...current, action])
    setError(null)
    try {
      await fn()
    } catch (actionError) {
      setError(errorMessage(actionError, fallbackError))
    } finally {
      setPending((current) => current.filter((item) => item !== action))
    }
  }

  return { pending, error, run }
}

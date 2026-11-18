'use client'

import * as React from 'react'

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
      setError(
        actionError instanceof Error ? actionError.message : fallbackError,
      )
    } finally {
      setPending((current) => current.filter((item) => item !== action))
    }
  }

  return { pending, error, run }
}

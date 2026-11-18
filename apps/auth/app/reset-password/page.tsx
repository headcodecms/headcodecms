'use client'

import * as React from 'react'

import { authClient } from '@/lib/auth-client'

// The link from the reset mail lands here with ?token=...
export default function ResetPasswordPage() {
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const token = new URLSearchParams(location.search).get('token')
    if (!token) return setError('This link is not valid. Ask for a new one.')
    const newPassword = String(
      new FormData(event.currentTarget).get('password'),
    )
    setPending(true)
    setError(null)
    const { error } = await authClient.resetPassword({ newPassword, token })
    setPending(false)
    if (error) setError(error.message ?? 'Could not reset the password.')
    else setDone(true)
  }

  return (
    <>
      <h1>New password</h1>
      {done ? (
        <p>
          Your password is changed. <a href="/sign-in">Sign in</a>
        </p>
      ) : (
        <form onSubmit={submit}>
          <input
            name="password"
            type="password"
            placeholder="New password"
            minLength={8}
            required
          />
          {error ? <p className="error">{error}</p> : null}
          <button disabled={pending}>Change password</button>
        </form>
      )}
    </>
  )
}

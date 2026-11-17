'use client'

import * as React from 'react'

import { authClient } from '@/lib/auth-client'

// Sign-in for MCP clients. During an authorization the URL carries a signed
// `oauth_query`; the auth client forwards it and continues to consent.
export default function SignInPage() {
  const [signUp, setSignUp] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    setPending(true)
    setError(null)
    const { error } = signUp
      ? await authClient.signUp.email({ email, password, name: email })
      : await authClient.signIn.email({ email, password })
    setPending(false)
    if (error) setError(error.message ?? 'Could not sign in.')
    else if (!new URLSearchParams(location.search).has('sig'))
      location.assign('/')
  }

  return (
    <>
      <h1>{signUp ? 'Create account' : 'Sign in'}</h1>
      <form onSubmit={submit}>
        <input name="email" type="email" placeholder="Email" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          minLength={8}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button disabled={pending}>
          {signUp ? 'Create account' : 'Sign in'}
        </button>
        <button
          type="button"
          className="link"
          onClick={() => setSignUp(!signUp)}
        >
          {signUp ? 'I have an account' : 'Create an account'}
        </button>
      </form>
    </>
  )
}

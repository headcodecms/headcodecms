'use client'

import * as React from 'react'

import { authClient } from '@/lib/auth-client'

type Mode = 'sign-in' | 'sign-up' | 'forgot'

const titles: Record<Mode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  forgot: 'Reset password',
}

// Sign-in for MCP clients. During an authorization the URL carries a signed
// `oauth_query`; the auth client forwards it and continues to consent.
export default function SignInPage() {
  const [mode, setMode] = React.useState<Mode>('sign-in')
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    setPending(true)
    setError(null)
    setNotice(null)
    if (mode === 'forgot') {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      })
      setPending(false)
      if (error) setError(error.message ?? 'Could not send the email.')
      else
        setNotice(
          'If an account exists for this address, we sent a link to reset the password.',
        )
      return
    }
    const { error } =
      mode === 'sign-up'
        ? await authClient.signUp.email({ email, password, name: email })
        : await authClient.signIn.email({ email, password })
    setPending(false)
    if (error) return setError(error.message ?? 'Could not sign in.')
    if (!new URLSearchParams(location.search).has('sig')) location.assign('/')
  }

  const switchTo = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  return (
    <>
      <h1>{titles[mode]}</h1>
      <form onSubmit={submit}>
        <input name="email" type="email" placeholder="Email" required />
        {mode === 'forgot' ? null : (
          <input
            name="password"
            type="password"
            placeholder="Password"
            minLength={8}
            required
          />
        )}
        {error ? <p className="error">{error}</p> : null}
        {notice ? <p>{notice}</p> : null}
        <button disabled={pending}>
          {mode === 'forgot' ? 'Send link' : titles[mode]}
        </button>
        {mode === 'sign-in' ? (
          <button
            type="button"
            className="link"
            onClick={() => switchTo('forgot')}
          >
            Forgot password?
          </button>
        ) : null}
        <button
          type="button"
          className="link"
          onClick={() => switchTo(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
        >
          {mode === 'sign-in' ? 'Create an account' : 'I have an account'}
        </button>
      </form>
    </>
  )
}

'use client'

import { useSearchParams } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/headcode/auth-client'
import { ErrorAlert } from '../../_components/admin-ui'

type Mode = 'sign-in' | 'sign-up' | 'reset'

const copy: Record<
  Mode,
  { title: string; description: string; submit: string }
> = {
  'sign-in': {
    title: 'Sign in to Headcode CMS',
    description: 'Use your email and password.',
    submit: 'Sign in',
  },
  'sign-up': {
    title: 'Create account',
    description: 'New accounts can read. An editor activates writing.',
    submit: 'Create account',
  },
  reset: {
    title: 'Reset password',
    description:
      'Headcode sends no email: the reset link is written to the server log. Ask the person who runs this site for it.',
    submit: 'Request reset link',
  },
}

// Sign-in for the admin and for MCP clients (Better Auth). During an MCP
// authorization the URL carries a signed `oauth_query`; the auth client
// forwards it and continues to the consent page.
export default function LoginPage() {
  const params = useSearchParams()
  const [mode, setMode] = React.useState<Mode>('sign-in')
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const switchTo = (next: Mode) => {
    setMode(next)
    setError(null)
    setNotice(null)
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const next = params.get('next') ?? '/admin'
    setPending(true)
    setError(null)
    if (mode === 'reset') {
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/admin/reset-password',
      })
      setPending(false)
      if (resetError)
        return setError(resetError.message ?? 'Could not request a reset.')
      return setNotice(
        'If the account exists, its reset link is now in the server log.',
      )
    }
    const { error: authError } =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email, password, callbackURL: next })
        : await authClient.signUp.email({
            email,
            password,
            name: String(form.get('name') || email),
            callbackURL: next,
          })
    setPending(false)
    if (authError) return setError(authError.message ?? 'Could not sign in.')
    // An MCP authorization redirects on its own; a normal sign-in goes on here.
    if (!params.has('sig')) location.assign(next)
  }

  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{copy[mode].title}</CardTitle>
          <CardDescription>{copy[mode].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            {mode === 'sign-up' ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" autoComplete="name" />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
            {mode !== 'reset' ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    mode === 'sign-in' ? 'current-password' : 'new-password'
                  }
                  minLength={8}
                  required
                />
              </div>
            ) : null}
            <ErrorAlert error={error} />
            {notice ? (
              <p className="text-muted-foreground text-sm">{notice}</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {copy[mode].submit}
            </Button>
            {mode === 'sign-in' ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchTo('sign-up')}
                >
                  Create an account
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchTo('reset')}
                >
                  Forgot password?
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => switchTo('sign-in')}
              >
                Back to sign in
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

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

// Sign-in for the admin and for MCP clients (Better Auth). During an MCP
// authorization the URL carries a signed `oauth_query`; the auth client
// forwards it and continues to the consent page.
export default function LoginPage() {
  const params = useSearchParams()
  const [mode, setMode] = React.useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))
    const next = params.get('next') ?? '/admin'
    setPending(true)
    setError(null)
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
          <CardTitle>
            {mode === 'sign-in' ? 'Sign in to Headcode CMS' : 'Create account'}
          </CardTitle>
          <CardDescription>
            {mode === 'sign-in'
              ? 'Use your email and password.'
              : 'New accounts can read. An editor activates writing.'}
          </CardDescription>
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
            <ErrorAlert error={error} />
            <Button type="submit" disabled={pending}>
              {mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
              }
            >
              {mode === 'sign-in'
                ? 'Create an account'
                : 'I already have an account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

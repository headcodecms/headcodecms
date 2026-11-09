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

// Target of the reset link from the server log (Better Auth adds ?token=).
export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get('token')
  const [error, setError] = React.useState<string | null>(
    params.get('error') ? 'This reset link is invalid or expired.' : null,
  )
  const [pending, setPending] = React.useState(false)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token) return setError('This reset link is invalid or expired.')
    const newPassword = String(
      new FormData(event.currentTarget).get('password'),
    )
    setPending(true)
    setError(null)
    const { error: resetError } = await authClient.resetPassword({
      newPassword,
      token,
    })
    setPending(false)
    if (resetError)
      return setError(resetError.message ?? 'Could not reset the password.')
    location.assign(new URL('/admin/login', location.href).href)
  }

  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Then sign in with the new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <ErrorAlert error={error} />
            <Button type="submit" disabled={pending || !token}>
              Save password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Container } from '../../_components/container'

const testLoginToken = process.env.NEXT_PUBLIC_HEADCODE_ADMIN_TEST_TOKEN
const isTestLoginEnabled =
  process.env.NODE_ENV === 'development' &&
  process.env.NEXT_PUBLIC_HEADCODE_ENABLE_TEST_LOGIN === 'true' &&
  Boolean(testLoginToken)

const getNextPath = (value: string | null) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/admin'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = getNextPath(searchParams.get('next'))
  const autoTestLogin = searchParams.get('test') === 'true'
  const handleSuccess = React.useCallback(() => {
    router.replace(next)
  }, [next, router])

  return (
    <div className="bg-background min-h-svh">
      <Container className="flex min-h-svh max-w-md items-center">
        <AuthLoading>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Checking session...
          </div>
        </AuthLoading>
        <Authenticated>
          <RedirectToAdmin next={next} />
        </Authenticated>
        <Unauthenticated>
          <Card className="w-full">
            <CardContent>
              <div className="mb-8">
                <h1 className="font-heading text-2xl font-semibold">
                  Headcode Admin
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Enter an allowed administrator email and we will send a magic
                  link.
                </p>
              </div>
              <LoginForm
                next={next}
                autoTestLogin={autoTestLogin}
                onSuccess={handleSuccess}
              />
            </CardContent>
          </Card>
        </Unauthenticated>
      </Container>
    </div>
  )
}

const RedirectToAdmin = ({ next }: { next: string }) => {
  const router = useRouter()

  React.useEffect(() => {
    router.replace(next)
  }, [next, router])

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" />
      Opening admin...
    </div>
  )
}

const LoginForm = ({
  next,
  autoTestLogin,
  onSuccess,
}: {
  next: string
  autoTestLogin: boolean
  onSuccess: () => void
}) => {
  const { signIn } = useAuthActions()
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const [testPending, setTestPending] = React.useState(false)
  const [sentEmail, setSentEmail] = React.useState<string | null>(null)

  const runTestLogin = React.useCallback(async () => {
    if (!isTestLoginEnabled || !testLoginToken) return

    setError(null)
    setTestPending(true)

    try {
      const result = await signIn('test-token', {
        token: testLoginToken,
        redirectTo: next,
      })

      if (result.signingIn) {
        onSuccess()
      }
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Could not use test login.',
      )
    } finally {
      setTestPending(false)
    }
  }, [next, onSuccess, signIn])

  React.useEffect(() => {
    if (!autoTestLogin || !isTestLoginEnabled) return

    const timer = window.setTimeout(() => void runTestLogin(), 0)

    return () => window.clearTimeout(timer)
  }, [autoTestLogin, runTestLogin])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setPending(true)

    try {
      const formData = new FormData(event.currentTarget)
      const email = String(formData.get('email') ?? '')
      formData.set('redirectTo', next)
      const result = await signIn('resend', formData)

      if (result.signingIn) {
        onSuccess()
        return
      }

      setSentEmail(email)
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Could not sign in.',
      )
    } finally {
      setPending(false)
    }
  }

  if (sentEmail) {
    return (
      <div className="space-y-5">
        <p className="text-sm">
          We sent a sign-in link to{' '}
          <span className="font-medium">{sentEmail}</span>.
        </p>
        <p className="text-muted-foreground text-sm">
          Open the link in that email to continue to the admin.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setSentEmail(null)}
        >
          Use another email
        </Button>
      </div>
    )
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
        />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Send magic link
      </Button>
      {isTestLoginEnabled ? (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending || testPending}
            onClick={() => void runTestLogin()}
          >
            {testPending ? <Loader2 className="animate-spin" /> : null}
            Test login
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Development only.
          </p>
        </div>
      ) : null}
    </form>
  )
}

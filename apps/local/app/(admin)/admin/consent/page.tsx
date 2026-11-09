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
import { authClient } from '@/headcode/auth-client'
import { ErrorAlert } from '../../_components/admin-ui'

// OAuth consent for MCP clients (Better Auth redirects here after sign-in).
// The auth client sends the signed query and follows the redirect back.
export default function ConsentPage() {
  const params = useSearchParams()
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const scopes = (params.get('scope') ?? '').split(' ').filter(Boolean)

  const answer = async (accept: boolean) => {
    setPending(true)
    setError(null)
    const { error: consentError } = await authClient.oauth2.consent({ accept })
    setPending(false)
    if (consentError) setError(consentError.message ?? 'Could not continue.')
  }

  return (
    <div className="bg-background flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Allow access to Headcode CMS?</CardTitle>
          <CardDescription>
            {params.get('client_id') ?? 'An application'} wants to use the MCP
            server with your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {scopes.length ? (
            <ul className="text-muted-foreground list-disc pl-5 text-sm">
              {scopes.map((scope) => (
                <li key={scope}>{scope}</li>
              ))}
            </ul>
          ) : null}
          <ErrorAlert error={error} />
          <div className="flex gap-2">
            <Button disabled={pending} onClick={() => answer(true)}>
              Allow
            </Button>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() => answer(false)}
            >
              Deny
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

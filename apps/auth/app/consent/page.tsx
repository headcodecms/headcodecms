'use client'

import { useSearchParams } from 'next/navigation'
import * as React from 'react'

import { authClient } from '@/lib/auth-client'

// OAuth consent for MCP clients. The auth client sends the signed query and
// follows the redirect back to the client.
function Consent() {
  const params = useSearchParams()
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)
  const scopes = (params.get('scope') ?? '').split(' ').filter(Boolean)

  const answer = async (accept: boolean) => {
    setPending(true)
    setError(null)
    const { error } = await authClient.oauth2.consent({ accept })
    setPending(false)
    if (error) setError(error.message ?? 'Could not continue.')
  }

  return (
    <>
      <h1>Allow access?</h1>
      <p>
        {params.get('client_id') ?? 'An application'} wants to use Headcode
        with your account.
      </p>
      {scopes.length ? (
        <ul>
          {scopes.map((scope) => (
            <li key={scope}>{scope}</li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="actions">
        <button disabled={pending} onClick={() => answer(true)}>
          Allow
        </button>
        <button disabled={pending} onClick={() => answer(false)}>
          Deny
        </button>
      </div>
    </>
  )
}

export default function ConsentPage() {
  return (
    <React.Suspense>
      <Consent />
    </React.Suspense>
  )
}

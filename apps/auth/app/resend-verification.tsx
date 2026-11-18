'use client'

import * as React from 'react'

import { authClient } from '@/lib/auth-client'

export function ResendVerification({ email }: { email: string }) {
  const [sent, setSent] = React.useState(false)
  return sent ? (
    <p>We sent a new link to {email}.</p>
  ) : (
    <button
      className="link"
      onClick={async () => {
        await authClient.sendVerificationEmail({ email, callbackURL: '/' })
        setSent(true)
      }}
    >
      Send the link again
    </button>
  )
}

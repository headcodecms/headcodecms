'use client'

import { Container } from '@/components/headcode/admin/container'
import { Header } from '@/components/headcode/admin/header'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircleIcon } from 'lucide-react'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const dbError = error.message.startsWith('DB_ERROR')
  const unauthorizedError = error.message.startsWith('UNAUTHORIZED')
  const otherError = !dbError && !unauthorizedError

  return (
    <Container>
      <Header />
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Something went wrong.</AlertTitle>
        <AlertDescription>
          {dbError && (
            <>
              <p>Database error</p>
              <ul className="list-inside list-disc text-sm">
                <li>On a fresh installation, check your setup</li>
                <li>Check your configuration</li>
                <li>Check your database connection</li>
              </ul>
            </>
          )}
          {unauthorizedError && (
            <>
              <p>Unauthorized</p>
              <ul className="list-inside list-disc text-sm">
                <li>You are not authorized to access this page</li>
                <li>Please contact your administrator</li>
              </ul>
            </>
          )}
          {otherError && <p>{error.message ?? 'An unknown error occurred'}</p>}
          <div className="flex justify-end">
            <Button
              variant="destructive"
              className="mt-4"
              onClick={() => reset()}
            >
              Try again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </Container>
  )
}

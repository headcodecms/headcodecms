'use client'

import { Container } from '@/components/headcode/container'
import { Header } from '@/components/headcode/header'
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

  return (
    <Container>
      <Header />
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Something went wrong.</AlertTitle>
        <AlertDescription>
          {error.message.startsWith('DB_ERROR') && (
            <>
              <p>Database error</p>
              <ul className="list-inside list-disc text-sm">
                <li>On a fresh installation, check your setup</li>
                <li>Check your configuration</li>
                <li>Check your database connection</li>
              </ul>
            </>
          )}
          {error.message.startsWith('UNAUTHORIZED') && (
            <>
              <p>Unauthorized</p>
              <ul className="list-inside list-disc text-sm">
                <li>You are not authorized to access this page</li>
                <li>Please contact your administrator</li>
              </ul>
            </>
          )}
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

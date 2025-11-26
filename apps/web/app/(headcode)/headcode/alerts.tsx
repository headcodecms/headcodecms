'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cloneVersion } from './actions'
import { Spinner } from '@/components/ui/spinner'

export function AlertClone({ clone }: { clone: string }) {
  const [isCloning, setIsCloning] = useState(false)

  const handleClone = async () => {
    setIsCloning(true)
    const result = await cloneVersion(clone)
    if (result.error) {
      setIsCloning(false)
      toast.error(result.error ?? 'Failed to clone database')
    }
  }

  return (
    <Alert className="mb-6 flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CircleAlertIcon />
        <AlertTitle>Clone database from {clone}</AlertTitle>
      </div>
      <Button size="sm" onClick={handleClone} disabled={isCloning}>
        {isCloning && <Spinner />}
        Clone
      </Button>
    </Alert>
  )
}

export function AlertNewInstallation() {
  return (
    <div className="mb-6 flex w-full">
      <Alert>
        <CircleAlertIcon />
        <AlertTitle>Welcome to Headcode CMS!</AlertTitle>
        <AlertDescription>
          <p>
            Headcode CMS is structured in dynamic and static content entries. An
            entry is identified by a namespace and a key, and has multiple
            sections.
          </p>
          <p>
            <strong>Dynamic entries</strong> are typically used for blog posts,
            pages, and all types of content that share the same section
            structure.
          </p>
          <p>
            <strong>Static entries</strong> are typically used for single
            entries that have a unique section structure. Examples include a
            navigation bar, footer, or a homepage with special sections.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  )
}

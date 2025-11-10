'use client'

import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { CircleAlertIcon } from 'lucide-react'

export function AlertClone({ clone }: { clone: string }) {
  const handleClone = () => {
    console.log('cloning database from', clone)
  }

  return (
    <Alert className="mb-6 flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <CircleAlertIcon />
        <AlertTitle>Clone database from {clone}</AlertTitle>
      </div>
      <Button size="sm" onClick={handleClone}>
        Clone
      </Button>
    </Alert>
  )
}

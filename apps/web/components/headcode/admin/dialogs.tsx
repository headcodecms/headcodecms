'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export function ConfirmationDialog({
  open,
  setOpen,
  title,
  description,
  buttonText,
  isSubmitting,
  handleSubmit,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  title: string
  description: string
  buttonText: string
  isSubmitting: boolean
  handleSubmit: (e: React.MouseEvent) => Promise<void>
}) {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: 'destructive' })}
            onClick={handleSubmit}
          >
            {isSubmitting && <Spinner />}
            {buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

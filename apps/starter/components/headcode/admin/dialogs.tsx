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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { MediaTable } from './media-table'
import type { ImageValue } from '@/lib/headcode/types'

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

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (image: ImageValue) => void
}) {
  const handleSelect = (image: ImageValue) => {
    onSelect(image)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-full overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription>
            Select an image from your media library
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <MediaTable onImageSelect={handleSelect} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

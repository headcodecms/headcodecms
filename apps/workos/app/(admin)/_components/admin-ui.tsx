import { Loader2 } from 'lucide-react'
import type * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

export const LoadingState = ({ children }: { children: React.ReactNode }) => (
  <div className="text-muted-foreground flex items-center gap-2 text-sm">
    <Loader2 className="size-4 animate-spin" />
    {children}
  </div>
)

export const EmptyState = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: React.ReactNode
  children: React.ReactNode
}) => (
  <Empty className="border">
    <EmptyHeader>
      <EmptyMedia variant="icon">{icon}</EmptyMedia>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{children}</EmptyDescription>
    </EmptyHeader>
  </Empty>
)

export const ErrorAlert = ({
  error,
  className,
}: {
  error: string | null
  className?: string
}) =>
  error ? (
    <p role="alert" className={cn('text-destructive text-sm', className)}>
      {error}
    </p>
  ) : null

// Dialog with Cancel + confirm button; cannot be dismissed while pending
// unless `dismissWhilePending` is set.
export const ConfirmDialog = ({
  open,
  onClose,
  pending,
  dismissWhilePending,
  title,
  description,
  children,
  confirmLabel,
  confirmIcon,
  confirmVariant,
  confirmDisabled,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  pending: boolean
  dismissWhilePending?: boolean
  title: React.ReactNode
  description: React.ReactNode
  children?: React.ReactNode
  confirmLabel: string
  confirmIcon?: React.ReactNode
  confirmVariant?: 'default' | 'destructive'
  confirmDisabled?: boolean
  onConfirm: () => void
}) => (
  <Dialog
    open={open}
    onOpenChange={(next: boolean) => {
      if (!next && (dismissWhilePending || !pending)) onClose()
    }}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={confirmDisabled || pending}
        >
          {pending ? <Loader2 className="animate-spin" /> : confirmIcon}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

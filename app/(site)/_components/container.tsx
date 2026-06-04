import * as React from 'react'

import { cn } from '@/lib/utils'

export const Container = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return (
    <div
      className={cn('mx-auto w-full max-w-5xl px-6', className)}
      {...props}
    />
  )
}

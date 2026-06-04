import { cn } from '@/lib/utils'

export const Container = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => (
  <div
    className={cn('mx-auto w-full max-w-5xl px-6', className)}
    {...props}
  />
)

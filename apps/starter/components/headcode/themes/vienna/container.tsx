export function Container({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">{children}</div>
    </div>
  )
}

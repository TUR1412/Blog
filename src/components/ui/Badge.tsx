import { cn } from '../../lib/cn'

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border/70 bg-white/5 px-3 py-1 text-xs font-medium text-fg/90',
        className,
      )}
    >
      {children}
    </span>
  )
}


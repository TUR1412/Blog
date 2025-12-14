import { cn } from '../../lib/cn'

export function Chip({
  children,
  selected,
  onClick,
  className,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'focus-ring tap inline-flex items-center rounded-full border px-3 py-1 text-xs',
        selected
          ? 'border-white/15 bg-white/12 text-fg'
          : 'border-border/70 bg-white/5 text-muted/80 hover:bg-white/10 hover:text-fg/90',
        className,
      )}
    >
      {children}
    </button>
  )
}


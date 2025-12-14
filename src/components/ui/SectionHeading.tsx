import { cn } from '../../lib/cn'

export function SectionHeading({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cn('mb-4', className)}>
      <div className="text-lg font-semibold text-fg">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-muted/80">{subtitle}</div> : null}
    </div>
  )
}


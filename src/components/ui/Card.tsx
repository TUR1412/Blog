import { cn } from '../../lib/cn'

export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('glass rounded-xl2 p-5', className)}>{children}</div>
}


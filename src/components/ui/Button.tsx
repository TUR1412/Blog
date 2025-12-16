import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { prefetchRoute } from '../../routes/prefetch'

type Variant = 'primary' | 'ghost' | 'outline'

function classes(variant: Variant) {
  const base =
    'focus-ring tap inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium'
  if (variant === 'ghost') {
    return cn(base, 'border border-border/70 bg-white/5 text-fg/90 hover:bg-white/10')
  }
  if (variant === 'outline') {
    return cn(base, 'border border-border/80 bg-transparent text-fg hover:bg-white/5')
  }
  return cn(
    base,
    'border border-white/10 bg-[linear-gradient(120deg,hsl(var(--accent)/.95),hsl(var(--accent2)/.90))] text-white',
    'shadow-lift',
  )
}

export function Button({
  children,
  variant = 'primary',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  className?: string
}) {
  return (
    <button {...props} className={cn(classes(variant), className)}>
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  children,
  variant = 'primary',
  className,
}: {
  to: string
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <Link
      to={to}
      onPointerEnter={() => prefetchRoute(to)}
      onFocus={() => prefetchRoute(to)}
      className={cn(classes(variant), className)}
    >
      {children}
    </Link>
  )
}

export function ExternalButtonLink({
  href,
  children,
  variant = 'ghost',
  className,
}: {
  href: string
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(classes(variant), className)}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 opacity-80" />
    </a>
  )
}

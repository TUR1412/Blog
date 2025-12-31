import { ArrowUpRight } from 'lucide-react'
import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { parseSafeLink } from '../../lib/safeUrl'
import { prefetchIntent } from '../../routes/prefetch'

type Variant = 'primary' | 'ghost' | 'outline' | 'danger'

function classes(variant: Variant) {
  const base =
    'focus-ring tap inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60'
  if (variant === 'ghost') {
    return cn(base, 'border border-border/70 bg-white/5 text-fg/90 hover:bg-white/10')
  }
  if (variant === 'outline') {
    return cn(base, 'border border-border/80 bg-transparent text-fg hover:bg-white/5')
  }
  if (variant === 'danger') {
    return cn(
      base,
      'border border-[hsl(var(--bad)/.28)] bg-[linear-gradient(120deg,hsl(var(--bad)/.92),hsl(var(--warn)/.72))] text-white',
      'shadow-lift',
    )
  }
  return cn(
    base,
    'border border-white/10 bg-[linear-gradient(120deg,hsl(var(--accent)/.95),hsl(var(--accent2)/.90))] text-white',
    'shadow-lift',
  )
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    className?: string
  }
>(function Button({ children, variant = 'primary', className, ...props }, ref) {
  return (
    <button {...props} ref={ref} className={cn(classes(variant), className)}>
      {children}
    </button>
  )
})

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
      onPointerEnter={() => prefetchIntent(to, 'hover')}
      onPointerDown={() => prefetchIntent(to, 'press')}
      onFocus={() => prefetchIntent(to, 'focus')}
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
  const safe = parseSafeLink(href)
  if (!safe) {
    return (
      <span className={cn(classes(variant), 'cursor-not-allowed opacity-60', className)} aria-disabled="true">
        {children}
        <ArrowUpRight className="h-4 w-4 opacity-80" />
      </span>
    )
  }

  if (safe.kind === 'internal') {
    return (
      <Link
        to={safe.href}
        onPointerEnter={() => prefetchIntent(safe.href, 'hover')}
        onPointerDown={() => prefetchIntent(safe.href, 'press')}
        onFocus={() => prefetchIntent(safe.href, 'focus')}
        className={cn(classes(variant), className)}
      >
        {children}
        <ArrowUpRight className="h-4 w-4 opacity-80" />
      </Link>
    )
  }

  return (
    <a
      href={safe.href}
      target={safe.kind === 'external' && safe.targetBlank ? '_blank' : undefined}
      rel={safe.kind === 'external' && safe.targetBlank ? 'noopener noreferrer' : undefined}
      className={cn(classes(variant), className)}
    >
      {children}
      <ArrowUpRight className="h-4 w-4 opacity-80" />
    </a>
  )
}

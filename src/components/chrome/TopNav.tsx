import { AnimatePresence, motion } from 'framer-motion'
import { Monitor, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useCommandPalette } from '../../providers/command/CommandPaletteProvider'
import { useTheme, type ThemePreference } from '../../providers/theme/ThemeProvider'
import { prefetchIntent } from '../../routes/prefetch'

const NAV = [
  { to: '/', label: '洞天' },
  { to: '/chronicles', label: '纪事' },
  { to: '/grotto', label: '洞府图' },
  { to: '/about', label: '人物志' },
  { to: '/relations', label: '关系谱' },
  { to: '/annotations', label: '批注馆' },
  { to: '/treasury', label: '藏品' },
  { to: '/notes', label: '札记' },
] as const

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      onPointerEnter={() => prefetchIntent(to, 'hover')}
      onPointerDown={() => prefetchIntent(to, 'press')}
      onFocus={() => prefetchIntent(to, 'focus')}
      className={({ isActive }) =>
        cn(
          'focus-ring tap relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm',
          'text-muted/80 hover:text-fg',
          isActive && 'text-fg',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <motion.span
              layoutId="navActive"
              className="absolute inset-0 rounded-xl border border-border/70 bg-white/10"
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            />
          ) : null}
          <span className="relative z-10">{label}</span>
        </>
      )}
    </NavLink>
  )
}

function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current
      if (!root) return
      const target = e.target as Node | null
      if (!target) return
      if (root.contains(target)) return
      setOpen(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const icon =
    theme === 'system' ? (
      <Monitor className="h-4 w-4" />
    ) : theme === 'dark' ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    )

  const options: Array<{ value: ThemePreference; label: string; hint?: string; icon: ReactNode }> = [
    {
      value: 'system',
      label: '跟随系统',
      hint: `当前：${effectiveTheme === 'light' ? '浅色' : '深色'}`,
      icon: <Monitor className="h-4 w-4" />,
    },
    { value: 'dark', label: '深色', icon: <Moon className="h-4 w-4" /> },
    { value: 'light', label: '浅色', icon: <Sun className="h-4 w-4" /> },
  ]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn(
          'focus-ring tap inline-flex items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-3 py-2 text-sm text-fg/90',
          'hover:bg-white/10',
        )}
        aria-label="切换主题"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {icon}
        <span className="hidden sm:inline">主题</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="主题选择"
            className="absolute right-0 top-full z-[80] mt-2 w-[220px] overflow-hidden rounded-xl2 border border-border/70 bg-[linear-gradient(180deg,var(--glass),var(--glass2))] shadow-lift backdrop-blur-lg"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-2">
              {options.map((opt) => {
                const active = theme === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    className={cn(
                      'focus-ring tap flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm',
                      active
                        ? 'border border-white/12 bg-white/10 text-fg'
                        : 'border border-transparent text-muted/85 hover:bg-white/6 hover:text-fg/90',
                    )}
                    onClick={() => {
                      setTheme(opt.value)
                      setOpen(false)
                    }}
                  >
                    <span className="text-fg/90">{opt.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block">{opt.label}</span>
                      {opt.hint ? <span className="block text-xs text-muted/70">{opt.hint}</span> : null}
                    </span>
                    {active ? <span className="text-xs text-muted/70">已选</span> : null}
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function TopNav() {
  const { open } = useCommandPalette()

  return (
    <header className="fixed left-0 top-0 z-[60] w-full">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/85 via-bg/55 to-transparent backdrop-blur-lg" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/8" />

      <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 lg:px-10">
        <Link to="/" className="focus-ring tap group inline-flex items-center gap-3 rounded-xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
            <span className="text-lg font-semibold tracking-wide text-fg">玄</span>
          </span>
          <div className="hidden sm:block">
            <div className="text-sm font-semibold text-fg">轩天帝 · 轩少</div>
            <div className="text-xs text-muted/80">修仙纪事</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
          {NAV.map((it) => (
            <NavItem key={it.to} to={it.to} label={it.label} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={open}
            className={cn(
              'focus-ring tap inline-flex items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-3 py-2 text-sm text-fg/90',
              'hover:bg-white/10',
            )}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">灵镜</span>
            <span className="hidden rounded-lg border border-border/70 bg-white/5 px-2 py-1 text-xs text-muted/80 sm:inline">
              Ctrl/⌘ K
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 pb-2 md:hidden lg:px-10">
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {NAV.map((it) => (
            <NavItem key={it.to} to={it.to} label={it.label} />
          ))}
        </div>
      </div>
    </header>
  )
}

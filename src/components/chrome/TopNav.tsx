import { motion } from 'framer-motion'
import { Moon, Search, Sun } from 'lucide-react'
import { NavLink, Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { useCommandPalette } from '../../providers/command/CommandPaletteProvider'
import { useTheme } from '../../providers/theme/ThemeProvider'

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

export function TopNav() {
  const { open } = useCommandPalette()
  const { theme, toggleTheme } = useTheme()

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

          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'focus-ring tap inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-fg/90',
              'hover:bg-white/10',
            )}
            aria-label={theme === 'dark' ? '切换浅色' : '切换深色'}
            title={theme === 'dark' ? '切换浅色' : '切换深色'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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

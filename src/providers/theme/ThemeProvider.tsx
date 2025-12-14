import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../../lib/constants'
import { canUseDOM, readString, writeString } from '../../lib/storage'

export type ThemeMode = 'dark' | 'light'

type ThemeContextValue = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function detectPreferredTheme(): ThemeMode {
  if (!canUseDOM()) return 'dark'
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle('theme-light', theme === 'light')
  root.classList.toggle('theme-dark', theme === 'dark')

  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
  if (meta) meta.content = theme === 'light' ? '#fbf7e6' : '#0b1020'
}

function readInitialTheme(): ThemeMode {
  const saved = readString(STORAGE_KEYS.theme, '')
  if (saved === 'light' || saved === 'dark') return saved
  return detectPreferredTheme()
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => readInitialTheme())

  useEffect(() => {
    applyTheme(theme)
    writeString(STORAGE_KEYS.theme, theme)
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }
  }, [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}


import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../../lib/constants'
import { readString, writeString } from '../../lib/storage'

export type ThemePreference = 'system' | 'dark' | 'light'
export type EffectiveTheme = 'dark' | 'light'

type ThemeContextValue = {
  theme: ThemePreference
  effectiveTheme: EffectiveTheme
  setTheme: (v: ThemePreference) => void
  cycleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): ThemePreference {
  const raw = readString(STORAGE_KEYS.theme, 'system')
  if (raw === 'dark' || raw === 'light' || raw === 'system') return raw
  return 'system'
}

function getSystemTheme(): EffectiveTheme {
  if (typeof window === 'undefined') return 'dark'
  const mql = window.matchMedia?.('(prefers-color-scheme: light)')
  return mql?.matches ? 'light' : 'dark'
}

function applyThemeAttribute(theme: ThemePreference) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
    return
  }
  root.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>(() => readInitialTheme())
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(() => getSystemTheme())

  useEffect(() => {
    applyThemeAttribute(theme)
    writeString(STORAGE_KEYS.theme, theme)
  }, [theme])

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!mql) return

    const onChange = () => setSystemTheme(mql.matches ? 'light' : 'dark')
    onChange()

    try {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    } catch {
      // Safari < 14
      mql.addListener(onChange)
      return () => mql.removeListener(onChange)
    }
  }, [])

  const effectiveTheme: EffectiveTheme = theme === 'system' ? systemTheme : theme

  const value = useMemo<ThemeContextValue>(() => {
    return {
      theme,
      effectiveTheme,
      setTheme,
      cycleTheme: () => {
        setTheme((prev) => (prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system'))
      },
    }
  }, [effectiveTheme, theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return ctx
}


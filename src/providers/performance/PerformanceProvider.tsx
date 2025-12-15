import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../../lib/constants'
import { canUseDOM, readString, writeString } from '../../lib/storage'

export type PerformanceMode = 'full' | 'lite'

type PerformanceContextValue = {
  mode: PerformanceMode
  setMode: (mode: PerformanceMode) => void
  toggle: () => void
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null)

function detectDefaultMode(): PerformanceMode {
  if (!canUseDOM()) return 'full'

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  if (reduceMotion) return 'lite'

  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 0
  const mem = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 0

  if (mem > 0 && mem <= 4) return 'lite'
  if (cores > 0 && cores <= 4) return 'lite'

  return 'full'
}

function applyMode(mode: PerformanceMode) {
  const root = document.documentElement
  root.classList.toggle('perf-lite', mode === 'lite')
  root.classList.toggle('perf-full', mode === 'full')
}

function readInitialMode(): PerformanceMode {
  const saved = readString(STORAGE_KEYS.perfMode, '')
  if (saved === 'lite' || saved === 'full') return saved
  return detectDefaultMode()
}

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PerformanceMode>(() => readInitialMode())

  useEffect(() => {
    applyMode(mode)
    writeString(STORAGE_KEYS.perfMode, mode)
  }, [mode])

  const value = useMemo<PerformanceContextValue>(() => {
    return {
      mode,
      setMode,
      toggle: () => setMode((m) => (m === 'lite' ? 'full' : 'lite')),
    }
  }, [mode])

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>
}

export function usePerformanceMode() {
  const ctx = useContext(PerformanceContext)
  if (!ctx) throw new Error('usePerformanceMode 必须在 PerformanceProvider 内使用')
  return ctx
}

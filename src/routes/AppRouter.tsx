import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Route, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { Suspense, lazy, useEffect, useRef } from 'react'
import { Card } from '../components/ui/Card'
import { HomePage } from '../pages/HomePage'
import { prefetchCoreRoutes, prefetchMarkdown, prefetchRoute } from './prefetch'

const ChroniclesPage = lazy(() =>
  import('../pages/ChroniclesPage').then((m) => ({ default: m.ChroniclesPage })),
)
const ChroniclePage = lazy(() =>
  import('../pages/ChroniclePage').then((m) => ({ default: m.ChroniclePage })),
)
const GrottoMapPage = lazy(() =>
  import('../pages/GrottoMapPage').then((m) => ({ default: m.GrottoMapPage })),
)
const AboutPage = lazy(() => import('../pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const TreasuryPage = lazy(() =>
  import('../pages/TreasuryPage').then((m) => ({ default: m.TreasuryPage })),
)
const NotesPage = lazy(() => import('../pages/NotesPage').then((m) => ({ default: m.NotesPage })))
const RelationsPage = lazy(() =>
  import('../pages/RelationsPage').then((m) => ({ default: m.RelationsPage })),
)
const AnnotationsPage = lazy(() =>
  import('../pages/AnnotationsPage').then((m) => ({ default: m.AnnotationsPage })),
)
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

function LazyEnter({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="relative"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={reduceMotion ? { duration: 0.12 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function RouteTransition({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  const enable = !reduceMotion
  return (
    <motion.div
      className="relative transform-gpu"
      style={enable ? { willChange: 'transform, opacity' } : undefined}
      initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.996 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.996 }}
      transition={reduceMotion ? { duration: 0.14 } : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
    >
      {enable ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] origin-left bg-[linear-gradient(90deg,transparent,hsl(var(--accent)/.70),hsl(var(--accent2)/.60),transparent)] opacity-0"
          initial={{ opacity: 0, scaleX: 0.62 }}
          animate={{ opacity: [0, 1, 0], scaleX: [0.62, 1, 1] }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}
      {children}
    </motion.div>
  )
}

function PageFallback() {
  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-7 md:p-10">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.28),transparent_62%)] blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.26),transparent_62%)] blur-3xl" />
        <div className="relative">
          <div className="h-4 w-28 rounded-lg bg-white/10 animate-pulse" />
          <div className="mt-4 h-7 w-64 rounded-xl bg-white/8 animate-pulse" />
          <div className="mt-4 grid gap-2">
            <div className="h-4 w-full rounded-lg bg-white/6 animate-pulse" />
            <div className="h-4 w-[92%] rounded-lg bg-white/6 animate-pulse" />
            <div className="h-4 w-[78%] rounded-lg bg-white/6 animate-pulse" />
          </div>
          <div className="mt-6 text-xs text-muted/70">灵息聚合中……</div>
        </div>
      </Card>
    </div>
  )
}

export function AppRouter() {
  const location = useLocation()
  const navType = useNavigationType()
  const pendingScrollTopRef = useRef(0)
  const prevScrollKeyRef = useRef<string | null>(null)

  useEffect(() => {
    const key = `xuantian.scroll.v1:${location.pathname}${location.search}`

    const prevKey = prevScrollKeyRef.current
    if (prevKey) {
      try {
        sessionStorage.setItem(prevKey, String(Math.max(0, Math.round(window.scrollY || 0))))
      } catch {
        // ignore
      }
    }

    let nextTop = 0
    if (navType === 'POP') {
      try {
        const raw = sessionStorage.getItem(key)
        const n = raw ? Number(raw) : NaN
        if (Number.isFinite(n) && n >= 0) nextTop = n
      } catch {
        // ignore
      }
    }

    pendingScrollTopRef.current = nextTop
    prevScrollKeyRef.current = key
  }, [location.pathname, location.search, navType])

  useEffect(() => {
    const startedAt = performance.now()
    const lastInputAtRef = { current: startedAt }
    const hasInteractedRef = { current: false }
    const prefetchStartedRef = { current: false }

    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const avoidPrefetch = Boolean(conn?.saveData) || String(conn?.effectiveType || '').includes('2g')

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
      .requestIdleCallback
    const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback

    const idleIds: number[] = []
    const timeoutIds: number[] = []

    const scheduleIdle = (cb: () => void, sched?: { timeout?: number; fallbackDelay?: number }) => {
      if (ric) {
        const id = ric(cb, { timeout: sched?.timeout ?? 2400 })
        idleIds.push(id)
        return
      }
      const t = window.setTimeout(cb, sched?.fallbackDelay ?? 1200)
      timeoutIds.push(t)
    }

    const guardLight = () => {
      if (avoidPrefetch) return false
      const now = performance.now()
      if (!hasInteractedRef.current) return false
      if (now - startedAt < 4200) return false
      if (now - lastInputAtRef.current < 1400) return false
      return true
    }

    const guardAll = () => {
      if (avoidPrefetch) return false
      const now = performance.now()
      if (!hasInteractedRef.current) return false
      if (now - startedAt < 9000) return false
      if (now - lastInputAtRef.current < 2200) return false
      return true
    }

    const runLight = () => {
      prefetchCoreRoutes({ includeNotes: true, priority: 'light', guard: guardLight })
    }

    const runAll = () => {
      prefetchCoreRoutes({ includeNotes: true, priority: 'all', guard: guardAll })
    }

    const runMarkdown = () => {
      if (avoidPrefetch) return
      if (!guardLight()) {
        scheduleIdle(runMarkdown, { timeout: 3200, fallbackDelay: 1800 })
        return
      }
      prefetchMarkdown()
    }

    // 轻量暖身：只预取“很轻”的页，避免首屏阅读期被预取打断（仍尊重 saveData/2g）
    scheduleIdle(() => {
      if (avoidPrefetch) return
      if (document.visibilityState && document.visibilityState !== 'visible') return
      if (hasInteractedRef.current) return
      prefetchCoreRoutes({ includeNotes: true, priority: 'light', guard: () => !avoidPrefetch })

      const likelyGraph =
        window.matchMedia?.('(min-width: 768px)').matches ??
        // matchMedia 不可用时按“桌面”为真：不强行预取，只在空闲时触发
        true
      if (likelyGraph) scheduleIdle(() => prefetchRoute('/relations'), { timeout: 4400, fallbackDelay: 2600 })
    }, { timeout: 3200, fallbackDelay: 2200 })

    const startPrefetch = () => {
      if (prefetchStartedRef.current) return
      prefetchStartedRef.current = true
      scheduleIdle(runLight, { timeout: 3200, fallbackDelay: 2200 })
      scheduleIdle(runMarkdown, { timeout: 5200, fallbackDelay: 2600 })
      scheduleIdle(runAll, { timeout: 6800, fallbackDelay: 9800 })
    }

    const markInput = () => {
      hasInteractedRef.current = true
      lastInputAtRef.current = performance.now()
      startPrefetch()
    }

    const opts: AddEventListenerOptions = { passive: true }
    window.addEventListener('pointerdown', markInput, opts)
    window.addEventListener('wheel', markInput, opts)
    window.addEventListener('touchstart', markInput, opts)
    window.addEventListener('keydown', markInput)

    return () => {
      window.removeEventListener('pointerdown', markInput, opts)
      window.removeEventListener('wheel', markInput, opts)
      window.removeEventListener('touchstart', markInput, opts)
      window.removeEventListener('keydown', markInput)

      for (const id of idleIds) cic?.(id)
      for (const t of timeoutIds) window.clearTimeout(t)
    }
  }, [])

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        window.scrollTo({ top: pendingScrollTopRef.current || 0, left: 0, behavior: 'auto' })
      }}
    >
      <RouteTransition key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/chronicles"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <ChroniclesPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/chronicles/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <ChroniclePage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/grotto"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <GrottoMapPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <AboutPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/relations"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <RelationsPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/treasury"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <TreasuryPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/notes"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <NotesPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="/annotations"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <AnnotationsPage />
                </LazyEnter>
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageFallback />}>
                <LazyEnter>
                  <NotFoundPage />
                </LazyEnter>
              </Suspense>
            }
          />
        </Routes>
      </RouteTransition>
    </AnimatePresence>
  )
}

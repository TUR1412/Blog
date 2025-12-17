import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { HomePage } from '../pages/HomePage'
import { prefetchCoreRoutes } from './prefetch'

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

function RouteTransition({ children, enableMotion }: { children: React.ReactNode; enableMotion: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      className="relative"
      style={{ willChange: 'transform, opacity' }}
      initial={reduceMotion || !enableMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
      transition={reduceMotion ? { duration: 0.12 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {!reduceMotion && enableMotion ? (
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
  const [enableMotion, setEnableMotion] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setEnableMotion(true), 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
      .requestIdleCallback
    const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback

    if (ric) {
      const id = ric(() => prefetchCoreRoutes({ includeNotes: true }), { timeout: 900 })
      return () => cic?.(id)
    }

    const t = window.setTimeout(() => prefetchCoreRoutes({ includeNotes: true }), 680)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }}
    >
      <RouteTransition key={location.pathname} enableMotion={enableMotion}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/chronicles"
            element={
              <Suspense fallback={<PageFallback />}>
                <ChroniclesPage />
              </Suspense>
            }
          />
          <Route
            path="/chronicles/:slug"
            element={
              <Suspense fallback={<PageFallback />}>
                <ChroniclePage />
              </Suspense>
            }
          />
          <Route
            path="/grotto"
            element={
              <Suspense fallback={<PageFallback />}>
                <GrottoMapPage />
              </Suspense>
            }
          />
          <Route
            path="/about"
            element={
              <Suspense fallback={<PageFallback />}>
                <AboutPage />
              </Suspense>
            }
          />
          <Route
            path="/relations"
            element={
              <Suspense fallback={<PageFallback />}>
                <RelationsPage />
              </Suspense>
            }
          />
          <Route
            path="/treasury"
            element={
              <Suspense fallback={<PageFallback />}>
                <TreasuryPage />
              </Suspense>
            }
          />
          <Route
            path="/notes"
            element={
              <Suspense fallback={<PageFallback />}>
                <NotesPage />
              </Suspense>
            }
          />
          <Route
            path="/annotations"
            element={
              <Suspense fallback={<PageFallback />}>
                <AnnotationsPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageFallback />}>
                <NotFoundPage />
              </Suspense>
            }
          />
        </Routes>
      </RouteTransition>
    </AnimatePresence>
  )
}

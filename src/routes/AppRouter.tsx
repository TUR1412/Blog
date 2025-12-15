import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Card } from '../components/ui/Card'
import { HomePage } from '../pages/HomePage'

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
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

function Page({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      transition={{
        type: 'spring',
        stiffness: 420,
        damping: 34,
        mass: 0.8,
      }}
    >
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

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <Page>
              <HomePage />
            </Page>
          }
        />
        <Route
          path="/chronicles"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <ChroniclesPage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="/chronicles/:slug"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <ChroniclePage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="/grotto"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <GrottoMapPage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="/about"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <AboutPage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="/relations"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <RelationsPage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="/treasury"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <TreasuryPage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="/notes"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <NotesPage />
              </Suspense>
            </Page>
          }
        />
        <Route
          path="*"
          element={
            <Page>
              <Suspense fallback={<PageFallback />}>
                <NotFoundPage />
              </Suspense>
            </Page>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

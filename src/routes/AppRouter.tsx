import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AboutPage } from '../pages/AboutPage'
import { ChroniclePage } from '../pages/ChroniclePage'
import { ChroniclesPage } from '../pages/ChroniclesPage'
import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { NotesPage } from '../pages/NotesPage'
import { TreasuryPage } from '../pages/TreasuryPage'

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
              <ChroniclesPage />
            </Page>
          }
        />
        <Route
          path="/chronicles/:slug"
          element={
            <Page>
              <ChroniclePage />
            </Page>
          }
        />
        <Route
          path="/about"
          element={
            <Page>
              <AboutPage />
            </Page>
          }
        />
        <Route
          path="/treasury"
          element={
            <Page>
              <TreasuryPage />
            </Page>
          }
        />
        <Route
          path="/notes"
          element={
            <Page>
              <NotesPage />
            </Page>
          }
        />
        <Route
          path="*"
          element={
            <Page>
              <NotFoundPage />
            </Page>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}


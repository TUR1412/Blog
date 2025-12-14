import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AuroraBackdrop } from '../visual/AuroraBackdrop'
import { Footer } from './Footer'
import { TopNav } from './TopNav'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [location.pathname])

  return null
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <a
        href="#content"
        className="focus-ring sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-black/60 focus:px-4 focus:py-2 focus:text-sm"
      >
        跳到正文
      </a>

      <AuroraBackdrop />
      <TopNav />
      <ScrollToTop />

      <main id="content" className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-24 lg:px-10">
        {children}
      </main>

      <Footer />
    </div>
  )
}


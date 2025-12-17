import { ASSET_VERSION } from '../../lib/constants'
import { useEffect, useState } from 'react'

export function AuroraBackdrop() {
  const noiseUrl = `${import.meta.env.BASE_URL}noise.svg?v=${ASSET_VERSION}`
  const [enhanced, setEnhanced] = useState(false)

  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
      .requestIdleCallback
    const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback

    let disposed = false
    let scheduled = false
    let idleId: number | null = null
    let timeoutId: number | null = null

    const scheduleEnhance = () => {
      if (scheduled || disposed) return
      scheduled = true

      if (ric) {
        idleId = ric(() => {
          if (disposed) return
          setEnhanced(true)
        }, { timeout: 1800 })
        return
      }

      timeoutId = window.setTimeout(() => {
        if (disposed) return
        setEnhanced(true)
      }, 980)
    }

    const opts: AddEventListenerOptions = { passive: true }

    const remove = () => {
      window.removeEventListener('pointerdown', onInput, opts)
      window.removeEventListener('wheel', onInput, opts)
      window.removeEventListener('touchstart', onInput, opts)
      window.removeEventListener('keydown', onInput)
    }

    const onInput = () => {
      remove()
      scheduleEnhance()
    }

    window.addEventListener('pointerdown', onInput, opts)
    window.addEventListener('wheel', onInput, opts)
    window.addEventListener('touchstart', onInput, opts)
    window.addEventListener('keydown', onInput)

    return () => {
      disposed = true
      remove()
      if (idleId != null) cic?.(idleId)
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-bg" />

      <div className="absolute inset-0">
        <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.40),transparent_62%)] blur-2xl" />
        <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.36),transparent_62%)] blur-2xl" />
        {enhanced ? (
          <>
            <div className="absolute -left-28 -top-28 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.50),transparent_62%)] blur-3xl" />
            <div className="absolute -right-36 top-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.46),transparent_62%)] blur-3xl" />
            <div className="absolute left-1/2 top-[42vh] h-[720px] w-[980px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,.10),transparent_66%)] blur-3xl" />
          </>
        ) : null}
      </div>

      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url(${noiseUrl})`,
          backgroundRepeat: 'repeat',
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/10 to-bg" />
    </div>
  )
}

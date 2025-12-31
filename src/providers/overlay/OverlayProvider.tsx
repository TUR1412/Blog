import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { trapFocusOnTab } from '../../lib/focus'

type ToastTone = 'neutral' | 'success' | 'warn' | 'danger'
type ToastItem = {
  id: string
  tone: ToastTone
  title?: string
  message: string
  createdAt: number
  durationMs: number
}

type ConfirmTone = 'neutral' | 'danger'
type ConfirmOptions = {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: ConfirmTone
}

type ConfirmRequest = Required<ConfirmOptions> & {
  id: string
  resolve: (v: boolean) => void
}

type ToastOptions = {
  tone?: ToastTone
  title?: string
  message: string
  durationMs?: number
}

type OverlayContextValue = {
  toast: (opts: ToastOptions) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const OverlayContext = createContext<OverlayContextValue | null>(null)

function useOverlayContext() {
  const ctx = useContext(OverlayContext)
  if (!ctx) throw new Error('useOverlay 必须在 OverlayProvider 内使用')
  return ctx
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toneIcon(tone: ToastTone) {
  if (tone === 'success') return <CheckCircle2 className="h-4 w-4" />
  if (tone === 'warn') return <AlertTriangle className="h-4 w-4" />
  if (tone === 'danger') return <XCircle className="h-4 w-4" />
  return <Info className="h-4 w-4" />
}

function toastClasses(tone: ToastTone) {
  if (tone === 'success') return 'border-[hsl(var(--good)/.30)] bg-[hsl(var(--good)/.08)]'
  if (tone === 'warn') return 'border-[hsl(var(--warn)/.30)] bg-[hsl(var(--warn)/.08)]'
  if (tone === 'danger') return 'border-[hsl(var(--bad)/.30)] bg-[hsl(var(--bad)/.08)]'
  return 'border-border/70 bg-white/6'
}

function ConfirmModal({
  req,
  onResolve,
}: {
  req: ConfirmRequest
  onResolve: (v: boolean) => void
}) {
  const reduceMotion = useReducedMotion() ?? false
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const messageId = `${baseId}-message`

  const close = useCallback((v: boolean) => onResolve(v), [onResolve])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  useEffect(() => {
    prevFocusRef.current = document.activeElement as HTMLElement | null
    const t = window.setTimeout(() => confirmBtnRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = prevFocusRef.current
    return () => el?.focus?.()
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(false)
        return
      }

      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      trapFocusOnTab(e, root)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [close])

  const toneFrame =
    req.tone === 'danger'
      ? 'border-[hsl(var(--bad)/.35)] bg-gradient-to-br from-[hsl(var(--bad)/.12)] via-white/5 to-transparent'
      : 'border-border/70 bg-gradient-to-br from-white/8 via-white/5 to-transparent'

  const confirmVariant = req.tone === 'danger' ? 'danger' : 'primary'

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-center justify-center p-4"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          aria-label="关闭"
          className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-xl"
          onClick={() => close(false)}
          aria-hidden="true"
          tabIndex={-1}
        />

        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={messageId}
          className={cn(
            'relative w-full max-w-[560px] overflow-hidden rounded-xl2 border p-6 shadow-lift',
            toneFrame,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
          transition={reduceMotion ? { duration: 0.12 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div id={titleId} className="text-base font-semibold text-fg">
                {req.title}
              </div>
              <div id={messageId} className="mt-2 whitespace-pre-line text-sm leading-7 text-muted/85">
                {req.message}
              </div>
            </div>
            <button
              type="button"
              className="focus-ring tap inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-muted/80 hover:bg-white/10 hover:text-fg"
              onClick={() => close(false)}
              aria-label="关闭对话框"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => close(false)}>
              {req.cancelText}
            </Button>
            <Button type="button" variant={confirmVariant} onClick={() => close(true)} ref={confirmBtnRef}>
              {req.confirmText}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

function ToastViewport({
  items,
  onDismiss,
}: {
  items: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const reduceMotion = useReducedMotion() ?? false

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed z-[110] flex w-full flex-col gap-2 px-4',
        'bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0 sm:max-w-[420px]',
      )}
      role="status"
      aria-live="polite"
      aria-relevant="additions"
      aria-atomic="true"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.id}
            role={t.tone === 'danger' ? 'alert' : undefined}
            aria-live={t.tone === 'danger' ? 'assertive' : undefined}
            aria-atomic={t.tone === 'danger' ? 'true' : undefined}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl2 border px-4 py-3 shadow-lift',
              toastClasses(t.tone),
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={reduceMotion ? { duration: 0.12 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mt-0.5 text-fg/90">{toneIcon(t.tone)}</div>
            <div className="min-w-0 flex-1">
              {t.title ? <div className="text-sm font-semibold text-fg">{t.title}</div> : null}
              <div className={cn('text-sm leading-6', t.title ? 'text-muted/85' : 'text-fg/90')}>
                {t.message}
              </div>
            </div>
            <button
              type="button"
              className="focus-ring tap inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-muted/80 hover:bg-white/10 hover:text-fg"
              onClick={() => onDismiss(t.id)}
              aria-label="关闭提示"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}

export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const [activeConfirm, setActiveConfirm] = useState<ConfirmRequest | null>(null)
  const confirmQueueRef = useRef<ConfirmRequest[]>([])

  const dismissToast = useCallback((id: string) => {
    const t = timersRef.current.get(id)
    if (t != null) {
      window.clearTimeout(t)
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = makeId('toast')
      const tone: ToastTone = opts.tone ?? 'neutral'
      const durationMs =
        typeof opts.durationMs === 'number'
          ? Math.max(800, Math.min(opts.durationMs, 12_000))
          : tone === 'danger'
            ? 5200
            : tone === 'warn'
              ? 4600
              : 3200

      const item: ToastItem = {
        id,
        tone,
        title: opts.title,
        message: opts.message,
        createdAt: Date.now(),
        durationMs,
      }

      setToasts((prev) => [item, ...prev].slice(0, 5))
      const timer = window.setTimeout(() => dismissToast(id), durationMs)
      timersRef.current.set(id, timer)
    },
    [dismissToast],
  )

  const resolveConfirm = useCallback((id: string, v: boolean) => {
    setActiveConfirm((prev) => {
      if (!prev || prev.id !== id) return prev
      prev.resolve(v)
      return null
    })
  }, [])

  const confirm = useCallback((opts: ConfirmOptions) => {
    const normalized: Required<ConfirmOptions> = {
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText ?? '确定',
      cancelText: opts.cancelText ?? '取消',
      tone: opts.tone ?? 'neutral',
    }

    return new Promise<boolean>((resolve) => {
      const req: ConfirmRequest = { ...normalized, id: makeId('confirm'), resolve }
      setActiveConfirm((prev) => {
        if (!prev) return req
        confirmQueueRef.current.push(req)
        return prev
      })
    })
  }, [])

  useEffect(() => {
    if (activeConfirm) return
    const next = confirmQueueRef.current.shift()
    if (!next) return
    setActiveConfirm(next)
  }, [activeConfirm])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      for (const t of timers.values()) window.clearTimeout(t)
      timers.clear()
    }
  }, [])

  const value = useMemo<OverlayContextValue>(() => ({ toast, confirm }), [confirm, toast])

  return (
    <OverlayContext.Provider value={value}>
      {children}
      <ToastViewport items={toasts} onDismiss={dismissToast} />
      {activeConfirm ? (
        <ConfirmModal req={activeConfirm} onResolve={(v) => resolveConfirm(activeConfirm.id, v)} />
      ) : null}
    </OverlayContext.Provider>
  )
}

export function useOverlay() {
  return useOverlayContext()
}

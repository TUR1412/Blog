type PerfSummaryV1 = {
  v: 1
  startedAt: number
  timeOrigin: number
  nav?: {
    type?: string
    domContentLoaded?: number
    load?: number
  }
  paints?: {
    fcp?: number
    lcp?: number
  }
  firstInput?: {
    delay: number
    type?: string
  }
  longTasks?: {
    count: number
    total: number
    max: number
  }
  cls?: {
    value: number
  }
}

const PERF_KEY = 'xuantian.perf.v1'

let perfInited = false

function canUseDOM() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

function readSessionJson<T>(key: string, fallback: T): T {
  if (!canUseDOM()) return fallback
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeSessionJson<T>(key: string, value: T) {
  if (!canUseDOM()) return
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore: 隐私模式/配额等
  }
}

function timeOrigin() {
  return typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number'
    ? performance.timeOrigin
    : Date.now()
}

export function getPerfSummary(): PerfSummaryV1 | null {
  if (!canUseDOM()) return null
  return readSessionJson<PerfSummaryV1 | null>(PERF_KEY, null)
}

export function initPerf() {
  if (perfInited) return
  perfInited = true
  if (!canUseDOM()) return
  if (typeof performance === 'undefined' || typeof PerformanceObserver === 'undefined') return

  const existing =
    readSessionJson<PerfSummaryV1 | null>(PERF_KEY, null) ??
    ({
      v: 1,
      startedAt: Date.now(),
      timeOrigin: timeOrigin(),
      longTasks: { count: 0, total: 0, max: 0 },
      cls: { value: 0 },
    } satisfies PerfSummaryV1)

  let summary: PerfSummaryV1 = existing

  let flushScheduled = false
  const scheduleFlush = () => {
    if (flushScheduled) return
    flushScheduled = true

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
      .requestIdleCallback

    const run = () => {
      flushScheduled = false
      writeSessionJson(PERF_KEY, summary)
      ;(window as unknown as { __XUANTIAN_PERF__?: PerfSummaryV1 }).__XUANTIAN_PERF__ = summary
    }

    if (ric) {
      void ric(run, { timeout: 1800 })
      return
    }
    window.setTimeout(run, 520)
  }

  // 导航（首入）计时：只抓一次，不反复写。
  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0] as PerformanceNavigationTiming | undefined
    if (nav) {
      summary = {
        ...summary,
        nav: {
          type: (nav as unknown as { type?: string }).type,
          domContentLoaded: nav.domContentLoadedEventEnd,
          load: nav.loadEventEnd,
        },
      }
      scheduleFlush()
    }
  } catch {
    // ignore
  }

  const safeObserve = (type: string, onEntry: (entry: PerformanceEntry) => void) => {
    try {
      const obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) onEntry(e)
        scheduleFlush()
      })
      obs.observe({ type, buffered: true } as PerformanceObserverInit)
      return obs
    } catch {
      return null
    }
  }

  // Long Task：抓“卡一下”的根因（执行阻塞）。
  safeObserve('longtask', (e) => {
    const duration = (e as PerformanceEntry & { duration?: number }).duration ?? 0
    const d = Math.max(0, duration)
    const longTasks = summary.longTasks ?? { count: 0, total: 0, max: 0 }
    summary = {
      ...summary,
      longTasks: {
        count: longTasks.count + 1,
        total: longTasks.total + d,
        max: Math.max(longTasks.max, d),
      },
    }
  })

  // FCP：首次内容可见（部分浏览器支持）。
  safeObserve('paint', (e) => {
    if (e.name !== 'first-contentful-paint') return
    summary = { ...summary, paints: { ...(summary.paints ?? {}), fcp: e.startTime } }
  })

  // LCP：最大内容绘制（会多次更新，取最后一次）。
  safeObserve('largest-contentful-paint', (e) => {
    summary = { ...summary, paints: { ...(summary.paints ?? {}), lcp: e.startTime } }
  })

  // FID：首次输入延迟（仅记录一次）。
  safeObserve('first-input', (e) => {
    if (summary.firstInput) return
    const any = e as PerformanceEntry & {
      processingStart?: number
      startTime?: number
      name?: string
    }
    const delay = Math.max(0, (any.processingStart ?? 0) - (any.startTime ?? 0))
    summary = { ...summary, firstInput: { delay, type: any.name } }
  })

  // CLS：累计布局偏移（排除近期有输入的偏移）。
  safeObserve('layout-shift', (e) => {
    const any = e as PerformanceEntry & { value?: number; hadRecentInput?: boolean }
    if (any.hadRecentInput) return
    const v = Math.max(0, any.value ?? 0)
    const cls = summary.cls ?? { value: 0 }
    summary = { ...summary, cls: { value: cls.value + v } }
  })

  // 最后一次落盘：避免会话结束丢失。
  const flushNow = () => writeSessionJson(PERF_KEY, summary)
  window.addEventListener('pagehide', flushNow, { passive: true })
  window.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState !== 'hidden') return
      flushNow()
    },
    { passive: true },
  )

  // 避免首帧争用：稍后再落一次（让首帧先走完）。
  window.setTimeout(() => scheduleFlush(), 1200)
  // 同步暴露一次，方便调试（不显示在 UI）。
  ;(window as unknown as { __XUANTIAN_PERF__?: PerfSummaryV1 }).__XUANTIAN_PERF__ = summary
}

export function perfMark(label: string) {
  if (!canUseDOM()) return
  if (typeof performance === 'undefined') return
  try {
    performance.mark(label)
  } catch {
    // ignore
  }
}

export function perfMeasure(name: string, startMark: string, endMark: string) {
  if (!canUseDOM()) return
  if (typeof performance === 'undefined') return
  try {
    performance.measure(name, startMark, endMark)
  } catch {
    // ignore
  }
}

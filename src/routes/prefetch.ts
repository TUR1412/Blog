type Importer = () => Promise<unknown>

const imported = new Set<string>()
const idleScheduled = new Set<string>()
let markdownPrefetched = false

type PrefetchPriority = 'light' | 'all'
type PrefetchGuard = () => boolean

function safeKey(raw: string) {
  return raw.trim() || '/'
}

function normalizePath(to: string) {
  const raw = to.trim()
  const noHash = raw.split('#')[0] ?? raw
  const noQuery = (noHash ?? '').split('?')[0] ?? noHash
  const cleaned = noQuery.trim()
  return cleaned || '/'
}

const ROUTE_IMPORTERS: Record<string, Importer> = {
  '/chronicles': () => import('../pages/ChroniclesPage'),
  '/chronicles/:slug': () => import('../pages/ChroniclePage'),
  '/grotto': () => import('../pages/GrottoMapPage'),
  '/about': () => import('../pages/AboutPage'),
  '/relations': () => import('../pages/RelationsPage'),
  '/treasury': () => import('../pages/TreasuryPage'),
  '/notes': () => import('../pages/NotesPage'),
  '/annotations': () => import('../pages/AnnotationsPage'),
  '/404': () => import('../pages/NotFoundPage'),
}

export function prefetchRoute(to: string) {
  const path = normalizePath(to)

  const importer =
    ROUTE_IMPORTERS[path] ??
    (path.startsWith('/chronicles/') ? ROUTE_IMPORTERS['/chronicles/:slug'] : null)

  if (!importer) return

  const key = safeKey(path)
  if (imported.has(key)) return
  imported.add(key)

  void importer()
}

export function prefetchRouteIdle(to: string) {
  const path = normalizePath(to)
  const key = safeKey(path)
  if (!path) return
  if (imported.has(key)) return
  if (idleScheduled.has(key)) return
  idleScheduled.add(key)

  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
    .requestIdleCallback

  const run = () => {
    idleScheduled.delete(key)
    prefetchRoute(path)
  }

  if (ric) {
    void ric(run, { timeout: 1800 })
    return
  }
  window.setTimeout(run, 240)
}

export function prefetchMarkdown() {
  if (markdownPrefetched) return
  markdownPrefetched = true
  void import('../components/content/Markdown')
}

function shouldPrefetchMarkdownForPath(path: string) {
  return path === '/grotto' || path === '/relations' || path === '/annotations' || path === '/notes'
}

export type PrefetchIntentKind = 'hover' | 'press' | 'focus'

export function prefetchIntent(to: string, kind: PrefetchIntentKind = 'hover') {
  const path = normalizePath(to)
  if (kind === 'hover') prefetchRouteIdle(to)
  else prefetchRoute(to)
  if (kind !== 'hover' && shouldPrefetchMarkdownForPath(path)) prefetchMarkdown()
}

export function prefetchCoreRoutes(opts?: {
  includeNotes?: boolean
  priority?: PrefetchPriority
  guard?: PrefetchGuard
}) {
  const includeNotes = opts?.includeNotes ?? false
  const priority: PrefetchPriority = opts?.priority ?? 'all'
  const guard = opts?.guard

  const lightTargets = ['/chronicles', '/about'] satisfies string[]
  const restTargets = [
    '/grotto',
    '/relations',
    '/annotations',
    '/treasury',
    includeNotes ? '/notes' : null,
  ].filter((x): x is string => typeof x === 'string')

  const targets = (priority === 'light' ? lightTargets : [...lightTargets, ...restTargets]) satisfies string[]

  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number })
    .requestIdleCallback

  const scheduleNext = (cb: () => void, opts2?: { timeout?: number; fallbackDelay?: number }) => {
    if (ric) {
      void ric(cb, { timeout: opts2?.timeout ?? 1200 })
      return
    }
    window.setTimeout(cb, opts2?.fallbackDelay ?? 420)
  }

  const run = (idx: number) => {
    const target = targets[idx]
    if (!target) return
    if (guard && !guard()) {
      scheduleNext(() => run(idx), { timeout: 1800, fallbackDelay: 680 })
      return
    }
    prefetchRoute(target)
    scheduleNext(() => run(idx + 1))
  }

  run(0)
}

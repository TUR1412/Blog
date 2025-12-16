type Importer = () => Promise<unknown>

const imported = new Set<string>()

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

export function prefetchCoreRoutes(opts?: { includeNotes?: boolean }) {
  const includeNotes = opts?.includeNotes ?? false
  const targets = [
    '/chronicles',
    '/grotto',
    '/relations',
    '/about',
    includeNotes ? '/notes' : null,
    '/annotations',
    '/treasury',
  ].filter((x): x is string => typeof x === 'string')

  const run = (idx: number) => {
    const target = targets[idx]
    if (!target) return
    prefetchRoute(target)
    window.setTimeout(() => run(idx + 1), 380)
  }

  run(0)
}


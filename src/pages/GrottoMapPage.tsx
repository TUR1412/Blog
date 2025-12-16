import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BookOpen, Compass, Copy, Layers, NotebookPen, PencilLine, ScrollText, Search, Trash2, X } from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS, type MarkdownHighlightOptions, Markdown } from '../components/content/Markdown'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SectionHeading } from '../components/ui/SectionHeading'
import {
  TIMELINE_LAYER_META,
  timelineLayerLabel,
  timeline,
  type TimelineEvent,
  type TimelineLayer,
} from '../content/timeline'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { findAllMatchRanges } from '../lib/find'
import { hapticSuccess, hapticTap } from '../lib/haptics'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }

type ToneFilter = 'all' | 'calm' | 'bright' | 'warn'
type LayerFilter = 'all' | TimelineLayer
type FindOptions = Required<MarkdownHighlightOptions>

type GrottoAnnotation = {
  text: string
  updatedAt: number
}

type GrottoAnnotations = Record<string, GrottoAnnotation>

type GrottoAnnotationsExportPayload = {
  kind: 'xuantian.grotto.annotations'
  v: 1
  exportedAt: number
  count: number
  annotations: GrottoAnnotations
}

function formatClock(ts: number) {
  if (!ts) return '未落笔'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function parseTone(raw: string | null): ToneFilter | null {
  if (!raw) return null
  if (raw === 'all' || raw === 'calm' || raw === 'bright' || raw === 'warn') return raw
  return null
}

function parseLayer(raw: string | null): LayerFilter | null {
  if (!raw) return null
  if (raw === 'all') return 'all'
  if (raw === '1' || raw === '2' || raw === '3' || raw === '4') return Number(raw) as TimelineLayer
  return null
}

function toneClass(tone: TimelineEvent['tone']) {
  if (tone === 'bright') return 'from-[hsl(var(--accent)/.22)] via-white/8 to-transparent'
  if (tone === 'warn') return 'from-[hsl(var(--warn)/.18)] via-white/8 to-transparent'
  return 'from-white/10 via-white/6 to-transparent'
}

export function GrottoMapPage() {
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const [storedSelectedId, setStoredSelectedId] = useLocalStorageState<string>(
    STORAGE_KEYS.grottoSelected,
    '',
  )
  const [storedLayer, setStoredLayer] = useLocalStorageState<string>(STORAGE_KEYS.grottoLayer, 'all')
  const [storedTone, setStoredTone] = useLocalStorageState<string>(STORAGE_KEYS.grottoTone, 'all')
  const [annotations, setAnnotations] = useLocalStorageState<GrottoAnnotations>(
    STORAGE_KEYS.grottoAnnotations,
    {},
  )
  const [query, setQuery] = useState('')
  const [annoQuery, setAnnoQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const appliedQuery = query.trim() ? deferredQuery : ''
  const deferredAnnoQuery = useDeferredValue(annoQuery)
  const appliedAnnoQuery = annoQuery.trim() ? deferredAnnoQuery : ''
  const [annoFindQuery, setAnnoFindQuery] = useState('')
  const deferredAnnoFindQuery = useDeferredValue(annoFindQuery)
  const appliedAnnoFindQuery = annoFindQuery.trim() ? deferredAnnoFindQuery : ''
  const [findOptions, setFindOptions] = useLocalStorageState<FindOptions>(
    STORAGE_KEYS.findOptions,
    DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS,
  )
  const [annoActiveHitIndex, setAnnoActiveHitIndex] = useState(0)
  const flashTimerRef = useRef<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const keyboardNavRef = useRef(false)
  const [annoDraftById, setAnnoDraftById] = useState<Record<string, string>>({})
  const annoImportRef = useRef<HTMLInputElement | null>(null)
  const annoTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const byId = useMemo(() => new Map(timeline.map((t) => [t.id, t] as const)), [])
  const eventSearchHayById = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of timeline) {
      map.set(
        t.id,
        `${t.when} ${t.title} ${t.detail} ${t.long ?? ''} ${timelineLayerLabel(t.layer)}`.toLowerCase(),
      )
    }
    return map
  }, [])
  const canonicalAnnotations = useMemo<GrottoAnnotations>(() => {
    const next: GrottoAnnotations = {}
    for (const [id, a] of Object.entries(annotations)) {
      if (!byId.has(id)) continue
      if (!a || typeof a !== 'object') continue
      const text = typeof a.text === 'string' ? a.text.trim() : ''
      if (!text) continue
      const updatedAt = typeof a.updatedAt === 'number' ? a.updatedAt : 0
      next[id] = { text, updatedAt }
    }
    return next
  }, [annotations, byId])

  const annotationCount = useMemo(() => Object.keys(canonicalAnnotations).length, [canonicalAnnotations])

  const toneFilter = useMemo<ToneFilter>(() => {
    const fromUrl = parseTone(searchParams.get('tone'))
    if (fromUrl) return fromUrl
    const fromStore = parseTone(storedTone)
    return fromStore ?? 'all'
  }, [searchParams, storedTone])

  const layerFilter = useMemo<LayerFilter>(() => {
    const fromUrl = parseLayer(searchParams.get('layer'))
    if (fromUrl) return fromUrl
    const fromStore = parseLayer(storedLayer)
    return fromStore ?? 'all'
  }, [searchParams, storedLayer])

  const filtered = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase()
    return timeline.filter((t) => {
      if (layerFilter !== 'all' && t.layer !== layerFilter) return false
      if (toneFilter !== 'all' && (t.tone ?? 'calm') !== toneFilter) return false
      if (!q) return true
      return (eventSearchHayById.get(t.id) ?? '').includes(q)
    })
  }, [appliedQuery, eventSearchHayById, layerFilter, toneFilter])

  const heavyTimeline = filtered.length > 80

  const annotatedEntries = useMemo(() => {
    const q = appliedAnnoQuery.trim().toLowerCase()
    const items: { t: TimelineEvent; ann: GrottoAnnotation }[] = []
    for (const t of timeline) {
      const ann = canonicalAnnotations[t.id]
      if (!ann) continue
      if (layerFilter !== 'all' && t.layer !== layerFilter) continue
      if (toneFilter !== 'all' && (t.tone ?? 'calm') !== toneFilter) continue
      if (q) {
        const base = eventSearchHayById.get(t.id) ?? ''
        const annHay = ann.text.toLowerCase()
        if (!base.includes(q) && !annHay.includes(q)) continue
      }
      items.push({ t, ann })
    }
    return items
  }, [appliedAnnoQuery, canonicalAnnotations, eventSearchHayById, layerFilter, toneFilter])

  const selectedId = useMemo(() => {
    const fromUrl = searchParams.get('id')
    if (fromUrl && byId.has(fromUrl)) return fromUrl
    if (storedSelectedId && byId.has(storedSelectedId)) return storedSelectedId
    return timeline[0]?.id ?? ''
  }, [byId, searchParams, storedSelectedId])

  const selected = selectedId ? byId.get(selectedId) ?? null : null
  const selectedAnnotation = selectedId ? annotations[selectedId] ?? null : null
  const annoDraft = selectedId ? (annoDraftById[selectedId] ?? selectedAnnotation?.text ?? '') : ''
  const annoSavedAt = selectedAnnotation?.updatedAt ?? 0

  const annoFindRanges = useMemo(() => {
    return findAllMatchRanges(annoDraft, appliedAnnoFindQuery, findOptions)
  }, [annoDraft, appliedAnnoFindQuery, findOptions])

  const annoHitCount = annoFindRanges.length

  useEffect(() => {
    const t = window.setTimeout(() => setAnnoActiveHitIndex(0), 0)
    return () => window.clearTimeout(t)
  }, [annoFindQuery, findOptions, selectedId])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setAnnoActiveHitIndex((prev) => (annoHitCount ? Math.min(prev, annoHitCount - 1) : 0))
    }, 0)
    return () => window.clearTimeout(t)
  }, [annoHitCount])

  const flashMessage = (msg: string) => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    setFlash(msg)
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 1000)
  }

  const jumpAnnoHit = (target: number) => {
    const inputQ = annoFindQuery.trim()
    const q = appliedAnnoFindQuery.trim()
    if (!inputQ) {
      flashMessage('先写一个检索词。')
      hapticTap()
      return
    }
    if (!q) {
      flashMessage('检索词正在点亮，稍等一息再跳。')
      hapticTap()
      return
    }
    if (!annoHitCount) {
      flashMessage('未命中。')
      hapticTap()
      return
    }
    if (!selected?.id) return

    const next = ((target % annoHitCount) + annoHitCount) % annoHitCount
    setAnnoActiveHitIndex(next)

    const range = annoFindRanges[next]
    if (!range) return
    const start = range.start
    const end = range.end
    window.setTimeout(() => {
      const el = annoTextareaRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(start, end)
    }, 0)

    hapticTap()
  }

  const toggleFindOption = (key: keyof FindOptions) => {
    setFindOptions((prev) => ({ ...prev, [key]: !prev[key] }))
    hapticTap()
  }

  const selectId = useCallback(
    (id: string) => {
      if (!id) return
      const next = new URLSearchParams(searchParams)
      next.set('id', id)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    if (!selectedId) return
    setStoredSelectedId(selectedId)
  }, [selectedId, setStoredSelectedId])

  useEffect(() => {
    setStoredTone(toneFilter)
  }, [toneFilter, setStoredTone])

  useEffect(() => {
    setStoredLayer(layerFilter === 'all' ? 'all' : String(layerFilter))
  }, [layerFilter, setStoredLayer])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false

    if (selectedId) {
      const fromUrl = next.get('id')
      if (fromUrl !== selectedId) {
        next.set('id', selectedId)
        changed = true
      }
    }

    const canonical = toneFilter === 'all' ? '' : toneFilter
    if ((next.get('tone') ?? '') !== canonical) {
      if (!canonical) next.delete('tone')
      else next.set('tone', canonical)
      changed = true
    }

    const canonicalLayer = layerFilter === 'all' ? '' : String(layerFilter)
    if ((next.get('layer') ?? '') !== canonicalLayer) {
      if (!canonicalLayer) next.delete('layer')
      else next.set('layer', canonicalLayer)
      changed = true
    }

    if (!changed) return
    setSearchParams(next, { replace: true })
  }, [layerFilter, searchParams, selectedId, setSearchParams, toneFilter])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const first = filtered[0]?.id
    if (!first) return
    if (filtered.some((t) => t.id === selectedId)) return
    selectId(first)
  }, [filtered, selectedId, selectId])

  useEffect(() => {
    if (!keyboardNavRef.current) return
    keyboardNavRef.current = false
    if (!selectedId) return
    const el = document.getElementById(`grotto-${selectedId}`)
    if (!el) return
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }, [reduceMotion, selectedId])

  useEffect(() => {
    if (!selectedId) return
    if (!(selectedId in annoDraftById)) return
    const currentSaved = selectedAnnotation?.text ?? ''
    const trimmed = annoDraft.trim()
    if (trimmed === currentSaved) return

    const t = window.setTimeout(() => {
      const now = Date.now()
      setAnnotations((prev) => {
        const next = { ...prev }
        if (!trimmed) {
          delete next[selectedId]
          return next
        }
        next[selectedId] = { text: trimmed, updatedAt: now }
        return next
      })
      flashMessage('已落笔。')
      hapticTap()
    }, 260)

    return () => window.clearTimeout(t)
  }, [annoDraft, annoDraftById, selectedAnnotation, selectedId, setAnnotations])

  const setTone = useCallback(
    (nextTone: ToneFilter) => {
      const next = new URLSearchParams(searchParams)
      if (nextTone === 'all') next.delete('tone')
      else next.set('tone', nextTone)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const setLayer = useCallback(
    (nextLayer: LayerFilter) => {
      const next = new URLSearchParams(searchParams)
      if (nextLayer === 'all') next.delete('layer')
      else next.set('layer', String(nextLayer))
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const copyLocation = async () => {
    if (!selectedId) {
      flashMessage('暂无可复制定位。')
      hapticTap()
      return
    }

    const params = new URLSearchParams()
    params.set('id', selectedId)
    if (toneFilter !== 'all') params.set('tone', toneFilter)
    if (layerFilter !== 'all') params.set('layer', String(layerFilter))

    const line = `定位：/grotto?${params.toString()}`
    try {
      await navigator.clipboard.writeText(line)
      hapticSuccess()
      flashMessage('已复制定位。')
    } catch {
      flashMessage('复制失败：剪贴板不可用。')
      hapticTap()
    }
  }

  const addSelectedToNotes = (includeAnnotation: boolean) => {
    if (!selected) return
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const ann = includeAnnotation ? annoDraft.trim() : ''
    const block = [
      `【${stamp} · 洞府图摘记】`,
      `${timelineLayerLabel(selected.layer)} · ${selected.when} · ${selected.title}`,
      selected.long ?? selected.detail,
      includeAnnotation && ann ? '' : null,
      includeAnnotation && ann ? `【路标批注】` : null,
      includeAnnotation && ann ? `“${ann}”` : null,
      includeAnnotation && ann ? `（来源：洞府图 · ${selected.title}）` : null,
    ]
      .filter((x): x is string => typeof x === 'string')
      .join('\n')

    const prev = readString(STORAGE_KEYS.notes, '')
    const next = prev.trim() ? `${prev}\n\n${block}` : block
    writeString(STORAGE_KEYS.notes, next)

    const prevMeta = readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 })
    const nextMeta: NotesMeta = {
      ...prevMeta,
      updatedAt: now.getTime(),
      lastSource: includeAnnotation && ann ? `洞府图（含批注）：${selected.title}` : `洞府图：${selected.title}`,
    }
    writeJson(STORAGE_KEYS.notesMeta, nextMeta)

    hapticSuccess()
    flashMessage('已收入札记。')
  }

  const exportAnnotations = () => {
    if (annotationCount === 0) {
      window.alert('当前没有可导出的路标批注。')
      return
    }

    const payload: GrottoAnnotationsExportPayload = {
      kind: 'xuantian.grotto.annotations',
      v: 1,
      exportedAt: Date.now(),
      count: annotationCount,
      annotations: canonicalAnnotations,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-grotto-annotations-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已导出批注存档。')
  }

  const exportAnnotationsScroll = () => {
    if (annotationCount === 0) {
      window.alert('当前没有可导出的路标批注。')
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const lines: string[] = [
      '轩天帝 · 洞府图路标批注文卷',
      `导出时间：${stamp} ${clock}`,
      `共计：${annotationCount} 处`,
      '',
    ]

    for (const t of timeline) {
      const ann = canonicalAnnotations[t.id]?.text?.trim() ?? ''
      if (!ann) continue

      lines.push(`【路标批注】${timelineLayerLabel(t.layer)} · ${t.when} · ${t.title}`)

      const parts = ann.split(/\r?\n/).map((x) => x.trimEnd())
      if (parts.length <= 1) {
        lines.push(`批注：${(parts[0] ?? '').trim()}`)
      } else {
        lines.push('批注：')
        for (const p of parts) lines.push(`  ${p}`)
      }

      lines.push('')
    }

    const text = `${lines.join('\n').trimEnd()}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-grotto-annotations-${stamp}.txt`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已导出批注文卷。')
  }

  const applyImportedAnnotations = (incoming: GrottoAnnotations) => {
    const known: GrottoAnnotations = {}
    for (const [id, a] of Object.entries(incoming)) {
      if (!byId.has(id)) continue
      const text = typeof a?.text === 'string' ? a.text.trim() : ''
      if (!text) continue
      const updatedAt = typeof a?.updatedAt === 'number' ? a.updatedAt : Date.now()
      known[id] = { text, updatedAt }
    }

    const count = Object.keys(known).length
    if (count === 0) {
      window.alert('导入失败：存档里没有可识别的批注。')
      return
    }

    const replace = window.confirm('导入方式：确定=覆盖现有批注；取消=合并（同一路标以导入为准）。')
    if (replace) {
      setAnnotations(known)
    } else {
      setAnnotations((prev) => ({ ...prev, ...known }))
    }

    setAnnoDraftById((prev) => {
      const next = { ...prev }
      for (const id of Object.keys(known)) delete next[id]
      return next
    })

    hapticSuccess()
    flashMessage(`已导入批注：${count} 处。`)
  }

  const importAnnotations = async (file: File) => {
    try {
      const raw = await file.text()
      const data = JSON.parse(raw) as unknown

      let incoming: unknown = null
      if (data && typeof data === 'object') {
        const maybe = data as Partial<GrottoAnnotationsExportPayload> & { annotations?: unknown }
        if (maybe.kind === 'xuantian.grotto.annotations' && maybe.v === 1 && maybe.annotations) {
          incoming = maybe.annotations
        } else {
          incoming = data
        }
      }

      if (!incoming || typeof incoming !== 'object') {
        window.alert('导入失败：存档格式不支持。')
        return
      }

      const incomingMap = incoming as Record<string, unknown>
      const normalized: GrottoAnnotations = {}
      for (const [id, v] of Object.entries(incomingMap)) {
        if (!v) continue
        if (typeof v === 'string') {
          const text = v.trim()
          if (!text) continue
          normalized[id] = { text, updatedAt: Date.now() }
          continue
        }
        if (typeof v === 'object') {
          const obj = v as Partial<GrottoAnnotation>
          const text = typeof obj.text === 'string' ? obj.text.trim() : ''
          if (!text) continue
          normalized[id] = { text, updatedAt: typeof obj.updatedAt === 'number' ? obj.updatedAt : Date.now() }
        }
      }

      applyImportedAnnotations(normalized)
    } catch {
      window.alert('导入失败：存档内容有误。')
    }
  }

  const appendAnnotationEntryToNotes = (t: TimelineEvent, annText: string) => {
    const ann = annText.trim()
    if (!ann) {
      window.alert('此处尚未落笔。')
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    const block = [
      `【${stamp} · 路标批注】`,
      `${timelineLayerLabel(t.layer)} · ${t.when} · ${t.title}`,
      `“${ann}”`,
      `（来源：洞府图 · ${t.title}）`,
    ].join('\n')

    const prev = readString(STORAGE_KEYS.notes, '')
    const next = prev.trim() ? `${prev}\n\n${block}` : block
    writeString(STORAGE_KEYS.notes, next)

    const prevMeta = readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 })
    const nextMeta: NotesMeta = {
      ...prevMeta,
      updatedAt: now.getTime(),
      lastSource: `洞府图批注：${t.title}`,
    }
    writeJson(STORAGE_KEYS.notesMeta, nextMeta)

    hapticSuccess()
    flashMessage('批注已并入札记。')
  }

  const appendAnnotationToNotes = () => {
    if (!selected) return
    const ann = annotations[selected.id]?.text?.trim() ?? ''
    appendAnnotationEntryToNotes(selected, ann)
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-7 md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.36),transparent_62%)] blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.30),transparent_62%)] blur-3xl" />

        <div className="relative">
          <Badge className="mb-4">洞府图</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">一条路，几处关口</h2>
          <p className="mt-3 max-w-[86ch] text-sm leading-7 text-muted/85">
            把年表写成“路”，不是为了神话谁，而是为了把分寸看清：哪一步靠守诺，哪一步靠边界，哪一步靠把次序留给后来人。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/chronicles">去读纪事</ButtonLink>
            <ButtonLink to="/about" variant="ghost">
              看人物志
            </ButtonLink>
            <ButtonLink to="/annotations" variant="ghost">
              批注馆 <ScrollText className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <SectionHeading title="灵脉路标" subtitle="点任一节点，右侧会展开细节与去处。" />

          <div className="rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white/5 text-fg/90">
                <Layers className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg">洞府四层（筛选只为看清次序）</div>
                <div className="mt-1">
                  立身 · 立名 · 立规 · 立秤。分层不是“比高低”，只是把关口按章法排好：你会更容易看见他是如何一步步把分寸写进规矩里。
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className={cn(
                'focus-within:ring-1 focus-within:ring-white/10',
                'flex w-full items-center gap-2 rounded-xl border border-border/70 bg-white/4 px-3 py-2',
              )}
            >
              <Search className="h-4 w-4 text-muted/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQuery('')
                    return
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    keyboardNavRef.current = true
                    const idx = filtered.findIndex((t) => t.id === selectedId)
                    const base = idx >= 0 ? idx : -1
                    const next = filtered[Math.min(filtered.length - 1, base + 1)]
                    if (next) selectId(next.id)
                    return
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    keyboardNavRef.current = true
                    const idx = filtered.findIndex((t) => t.id === selectedId)
                    const base = idx >= 0 ? idx : filtered.length
                    const next = filtered[Math.max(0, base - 1)]
                    if (next) selectId(next.id)
                    return
                  }
                  if (e.key === 'Enter') {
                    const el = annoTextareaRef.current
                    if (!el) return
                    el.focus()
                    el.setSelectionRange(el.value.length, el.value.length)
                    return
                  }
                }}
                placeholder="搜路标：霜月 / 抄经 / 断桥 / 北境 / 公议……（↑↓ 走位，Enter 落笔，Esc 清空）"
                className="w-full bg-transparent text-sm text-fg placeholder:text-muted/70 focus:outline-none"
              />
              {query.trim() ? (
                <button
                  type="button"
                  className="focus-ring tap inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-fg/90 hover:bg-white/10"
                  onClick={() => setQuery('')}
                  aria-label="清空搜索"
                  title="清空"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <div className="text-xs text-muted/70 sm:shrink-0">
              {query.trim() && query.trim() !== appliedQuery.trim() ? '检索中…' : `显示 ${filtered.length} / ${timeline.length}`}
            </div>
          </div>

            <div className="mt-3 grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted/70">洞府层</div>
              <Chip
                selected={layerFilter === 'all'}
                className="relative overflow-hidden"
                onClick={() => setLayer('all')}
              >
                {!reduceMotion && layerFilter === 'all' ? (
                  <motion.span
                    layoutId="grottoLayerActive"
                    className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">全部</span>
              </Chip>
              {([1, 2, 3, 4] as TimelineLayer[]).map((layer) => {
                const meta = TIMELINE_LAYER_META[layer]
                return (
                  <Chip
                    key={String(layer)}
                    selected={layerFilter === layer}
                    className="relative overflow-hidden"
                    onClick={() => setLayer(layer)}
                  >
                    {!reduceMotion && layerFilter === layer ? (
                      <motion.span
                        layoutId="grottoLayerActive"
                        className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                        transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                      />
                    ) : null}
                    <span className="relative z-10">{meta.label}</span>
                  </Chip>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted/70">气象</div>
              <Chip selected={toneFilter === 'all'} className="relative overflow-hidden" onClick={() => setTone('all')}>
                {!reduceMotion && toneFilter === 'all' ? (
                  <motion.span
                    layoutId="grottoToneActive"
                    className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">全部</span>
              </Chip>
              <Chip
                selected={toneFilter === 'calm'}
                className="relative overflow-hidden"
                onClick={() => setTone('calm')}
              >
                {!reduceMotion && toneFilter === 'calm' ? (
                  <motion.span
                    layoutId="grottoToneActive"
                    className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">平</span>
              </Chip>
              <Chip
                selected={toneFilter === 'bright'}
                className="relative overflow-hidden"
                onClick={() => setTone('bright')}
              >
                {!reduceMotion && toneFilter === 'bright' ? (
                  <motion.span
                    layoutId="grottoToneActive"
                    className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">明</span>
              </Chip>
              <Chip
                selected={toneFilter === 'warn'}
                className="relative overflow-hidden"
                onClick={() => setTone('warn')}
              >
                {!reduceMotion && toneFilter === 'warn' ? (
                  <motion.span
                    layoutId="grottoToneActive"
                    className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">警</span>
              </Chip>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />

            <div className="grid gap-3">
              {filtered.map((t, idx) => {
                const left = idx % 2 === 0
                const active = t.id === selectedId
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'relative flex',
                      left ? 'justify-start pr-12' : 'justify-end pl-12',
                    )}
                  >
                    <motion.button
                      type="button"
                      id={`grotto-${t.id}`}
                      aria-pressed={active}
                      onClick={() => {
                        keyboardNavRef.current = false
                        selectId(t.id)
                      }}
                      className={cn(
                        'focus-ring tap relative w-full max-w-[520px] rounded-xl border bg-white/4 px-5 py-4 text-left',
                        '[content-visibility:auto] [contain-intrinsic-size:520px_140px]',
                        active
                          ? reduceMotion
                            ? 'border-white/20 bg-white/8 ring-1 ring-white/10'
                            : 'border-white/20 bg-white/8'
                          : 'border-border/60 hover:bg-white/7',
                      )}
                      initial={reduceMotion || heavyTimeline ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reduceMotion || heavyTimeline ? 0 : idx * 0.02,
                        type: 'spring',
                        stiffness: 420,
                        damping: 34,
                        mass: 0.9,
                      }}
                    >
                      {!reduceMotion && active ? (
                        <motion.span
                          layoutId="grottoTimelineActive"
                          className="pointer-events-none absolute inset-0 rounded-xl border border-white/20 ring-1 ring-white/10"
                          transition={{ type: 'spring', stiffness: 560, damping: 38 }}
                        />
                      ) : null}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-muted/70">{t.when}</div>
                          <div className="mt-1 text-sm font-semibold text-fg">{t.title}</div>
                          <div className="mt-2 text-xs leading-6 text-muted/80">{t.detail}</div>
                        </div>
                        <div className="mt-1 shrink-0 text-right">
                          <div className="text-xs text-muted/70">{active ? '已选' : '选'}</div>
                          <div className="mt-1 inline-flex items-center rounded-full border border-border/70 bg-white/5 px-2 py-0.5 text-[11px] text-muted/80">
                            {timelineLayerLabel(t.layer)}
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
                      <motion.div
                        className={cn(
                          'grid h-8 w-8 place-items-center rounded-full border',
                          active
                            ? 'border-white/20 bg-white/10 text-fg'
                            : 'border-white/12 bg-white/6 text-muted/70',
                        )}
                        animate={
                          reduceMotion || !active
                            ? undefined
                            : { scale: [1, 1.08, 1], boxShadow: ['0 0 0 rgba(0,0,0,0)', '0 0 26px rgba(255,255,255,.12)', '0 0 0 rgba(0,0,0,0)'] }
                        }
                        transition={{ duration: 2.6, repeat: reduceMotion || !active ? 0 : Infinity, ease: 'easeInOut' }}
                      >
                        <Compass className={cn('h-4 w-4', active && 'text-fg')} />
                      </motion.div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <SectionHeading title="节点详记" subtitle="不写玄虚，只写可落地的行止。" />

          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
              >
                <div className={cn('rounded-xl bg-gradient-to-r p-[1px]', toneClass(selected.tone))}>
                  <div className="rounded-xl bg-[hsl(var(--card)/.55)] px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-muted/70">{selected.when}</div>
                        <div className="mt-1 text-lg font-semibold text-fg">{selected.title}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-[11px] text-muted/80">
                            {timelineLayerLabel(selected.layer)}
                          </span>
                          <span className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-[11px] text-muted/80">
                            {(selected.tone ?? 'calm') === 'warn'
                              ? '警'
                              : (selected.tone ?? 'calm') === 'bright'
                                ? '明'
                                : '平'}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-xl border border-border/70 bg-white/5 px-3 py-2 text-xs text-muted/80">
                        路标
                      </div>
                    </div>

                    <div className="mt-3 text-sm leading-7 text-muted/85">
                      {selected.long ?? selected.detail}
                    </div>

                    <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white/5 text-fg/90">
                              <PencilLine className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-fg">路标批注</div>
                              <div className="text-xs text-muted/70">写一句你自己的分寸（自动保存）。</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted/70">最近：{formatClock(annoSavedAt)}</div>
                      </div>

                      <textarea
                        ref={annoTextareaRef}
                        value={annoDraft}
                        onChange={(e) => {
                          if (!selected.id) return
                          const nextText = e.target.value
                          setAnnoDraftById((prev) => ({ ...prev, [selected.id]: nextText }))
                        }}
                        rows={3}
                        placeholder="例如：这一关口不是靠“更狠”，是靠把账写清、把空补上。"
                        className={cn(
                          'mt-3 w-full resize-y rounded-xl border border-border/70 bg-white/4 px-4 py-3',
                          'text-sm leading-7 text-fg placeholder:text-muted/70',
                          'focus-ring',
                        )}
                      />

                      <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-fg">卷内检索</div>
                          {annoFindQuery.trim() ? (
                            <div className="text-xs text-muted/70">
                              {annoFindQuery.trim() !== appliedAnnoFindQuery.trim()
                                ? '点亮中…'
                                : annoHitCount
                                  ? `${Math.min(annoActiveHitIndex + 1, annoHitCount)}/${annoHitCount}`
                                  : '未命中'}
                            </div>
                          ) : (
                            <div className="text-xs text-muted/70">输入即点亮</div>
                          )}
                        </div>

                        <div
                          className={cn(
                            'mt-2 flex w-full items-center gap-2 rounded-xl border border-border/70 bg-white/4 px-3 py-2',
                            'focus-within:ring-1 focus-within:ring-white/10',
                          )}
                        >
                          <Search className="h-4 w-4 text-muted/70" />
                          <input
                            value={annoFindQuery}
                            onChange={(e) => setAnnoFindQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setAnnoFindQuery('')
                              if (e.key === 'Enter') jumpAnnoHit(0)
                            }}
                            placeholder="搜批注：分寸 / 规矩 / 断桥……（Enter 跳首处，Esc 清空）"
                            className="w-full bg-transparent text-sm text-fg placeholder:text-muted/70 focus:outline-none"
                          />
                          {annoFindQuery.trim() ? (
                            <button
                              type="button"
                              className="focus-ring tap inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-fg/90 hover:bg-white/10"
                              onClick={() => setAnnoFindQuery('')}
                              aria-label="清空卷内检索"
                              title="清空"
                            >
                              ×
                            </button>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <Chip
                            selected={findOptions.matchCase}
                            onClick={() => toggleFindOption('matchCase')}
                            title="区分大小写（默认不区分）"
                          >
                            区分大小写
                          </Chip>
                          <Chip
                            selected={findOptions.wholeWord}
                            onClick={() => toggleFindOption('wholeWord')}
                            title="整词匹配（仅对字母/数字/下划线有效）"
                          >
                            整词
                          </Chip>
                          <Chip
                            selected={findOptions.ignorePunctuation}
                            onClick={() => toggleFindOption('ignorePunctuation')}
                            title="忽略空格与标点：可跨「、·—」等符号命中"
                          >
                            忽略标点
                          </Chip>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className={cn(
                              'focus-ring tap inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-medium',
                              annoHitCount ? 'bg-white/5 text-fg/90 hover:bg-white/10' : 'bg-white/3 text-muted/60',
                            )}
                            onClick={() => jumpAnnoHit(annoActiveHitIndex - 1)}
                            disabled={!annoHitCount}
                          >
                            上一处 <span className="text-muted/70">↑</span>
                          </button>
                          <button
                            type="button"
                            className={cn(
                              'focus-ring tap inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-medium',
                              annoHitCount ? 'bg-white/5 text-fg/90 hover:bg-white/10' : 'bg-white/3 text-muted/60',
                            )}
                            onClick={() => jumpAnnoHit(annoActiveHitIndex + 1)}
                            disabled={!annoHitCount}
                          >
                            下一处 <span className="text-muted/70">↓</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Button type="button" variant="ghost" onClick={appendAnnotationToNotes} className="justify-start">
                          <NotebookPen className="h-4 w-4" />
                          并入札记
                          <span className="ml-auto text-muted/70">＋</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!selected.id) return
                            if (!annotations[selected.id]) return
                            const ok = window.confirm('确定清空此处批注？')
                            if (!ok) return
                            setAnnotations((prev) => {
                              const next = { ...prev }
                              delete next[selected.id]
                              return next
                            })
                            setAnnoDraftById((prev) => {
                              const next = { ...prev }
                              delete next[selected.id]
                              return next
                            })
                            hapticTap()
                            flashMessage('已清空批注。')
                          }}
                          className="justify-start"
                          disabled={!annotations[selected.id]?.text}
                        >
                          <Trash2 className="h-4 w-4" />
                          清空
                        </Button>
                      </div>

                      <input
                        ref={annoImportRef}
                        type="file"
                        accept="application/json,text/plain"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0]
                          e.currentTarget.value = ''
                          if (!file) return
                          void importAnnotations(file)
                        }}
                      />

                      <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-fg">批注存档</div>
                          <div className="text-xs text-muted/70">已写 {annotationCount} 处</div>
                        </div>
                        <div className="mt-2 text-xs leading-6 text-muted/80">
                          建议偶尔导出一次存档，防止设备更换或清理缓存后丢失。
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            variant="ghost"
                            className="justify-start"
                            onClick={exportAnnotationsScroll}
                            disabled={annotationCount === 0}
                          >
                            导出文卷
                            <span className="ml-auto text-muted/70">↓</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="justify-start"
                            onClick={exportAnnotations}
                            disabled={annotationCount === 0}
                          >
                            导出存档
                            <span className="ml-auto text-muted/70">↓</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="justify-start"
                            onClick={() => annoImportRef.current?.click()}
                          >
                            导入存档
                            <span className="ml-auto text-muted/70">↑</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-2">
                      {selected.chronicleSlug ? (
                        <Link
                          to={`/chronicles/${selected.chronicleSlug}`}
                          className="focus-ring tap inline-flex w-full items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-4 py-3 text-sm font-medium text-fg/90 hover:bg-white/10"
                        >
                          <BookOpen className="h-4 w-4" />
                          去读对应纪事
                          <ArrowRight className="ml-auto h-4 w-4 text-muted/70" />
                        </Link>
                      ) : null}

                      <Button type="button" variant="ghost" onClick={copyLocation} className="justify-start">
                        <Copy className="h-4 w-4" />
                        复制定位
                        <span className="ml-auto text-muted/70">⎘</span>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => addSelectedToNotes(false)}
                        className="justify-start"
                      >
                        <NotebookPen className="h-4 w-4" />
                        收入札记
                        <span className="ml-auto text-muted/70">＋</span>
                      </Button>

                      {annoDraft.trim() ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => addSelectedToNotes(true)}
                          className="justify-start"
                        >
                          <NotebookPen className="h-4 w-4" />
                          收入札记（含批注）
                          <span className="ml-auto text-muted/70">＋</span>
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
                        className="justify-start"
                      >
                        回到页首
                        <span className="ml-auto text-muted/70">↑</span>
                      </Button>
                    </div>

                    <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
                      读法建议：先看“节点详记”，再去读对应纪事，最后把你自己的分寸写进札记——久了就成心法。
                    </div>

                    <AnimatePresence>
                      {flash ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-xs text-muted/80"
                        >
                          {flash}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
                className="rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center"
              >
                <div className="text-sm font-semibold text-fg">暂无节点</div>
                <div className="mt-2 text-xs leading-6 text-muted/80">年表为空时，这里会保持安静。</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>

      <Card className="relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.20),transparent_62%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.18),transparent_62%)] blur-3xl" />

        <SectionHeading title="批注总览" subtitle="把你写下的分寸摊开，看一眼就知道路走到哪。" />

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className={cn(
              'focus-within:ring-1 focus-within:ring-white/10',
              'flex w-full items-center gap-2 rounded-xl border border-border/70 bg-white/4 px-3 py-2',
            )}
          >
            <Search className="h-4 w-4 text-muted/70" />
            <input
              value={annoQuery}
              onChange={(e) => setAnnoQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setAnnoQuery('')
              }}
              placeholder="搜批注：分寸 / 规矩 / 补空 / 断桥……（Esc 清空）"
              className="w-full bg-transparent text-sm text-fg placeholder:text-muted/70 focus:outline-none"
            />
            {annoQuery.trim() ? (
              <button
                type="button"
                className="focus-ring tap inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-fg/90 hover:bg-white/10"
                onClick={() => setAnnoQuery('')}
                aria-label="清空搜索"
                title="清空"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="text-xs text-muted/70 sm:shrink-0">
            {annoQuery.trim() && annoQuery.trim() !== appliedAnnoQuery.trim()
              ? '检索中…'
              : `显示 ${annotatedEntries.length} / 已写 ${annotationCount} 处`}
          </div>
        </div>

        {annotationCount === 0 ? (
          <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
            <div className="text-sm font-semibold text-fg">还没写下批注</div>
            <div className="mt-2 text-xs leading-6 text-muted/80">
              先在右侧“路标批注”落笔一两句，再回来看，会更像把路走稳了。
            </div>
          </div>
        ) : annotatedEntries.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {annotatedEntries.map(({ t, ann }) => {
              const tone = (t.tone ?? 'calm') === 'warn' ? '警' : (t.tone ?? 'calm') === 'bright' ? '明' : '平'

              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-xl border border-border/60 bg-white/4 px-5 py-4',
                    '[content-visibility:auto] [contain-intrinsic-size:420px_240px]',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-muted/70">
                        {timelineLayerLabel(t.layer)} · {t.when}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-fg">{t.title}</div>
                    </div>
                    <span className="shrink-0 rounded-full border border-border/70 bg-white/5 px-2 py-1 text-[11px] text-muted/80">
                      {tone}
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3">
                    <Markdown text={ann.text} className="prose-sm leading-7" />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        selectId(t.id)
                        hapticTap()
                      }}
                      className="justify-start"
                    >
                      <Compass className="h-4 w-4" />
                      定位到路标
                      <span className="ml-auto text-muted/70">→</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => appendAnnotationEntryToNotes(t, ann.text)}
                      className="justify-start"
                    >
                      <NotebookPen className="h-4 w-4" />
                      并入札记
                      <span className="ml-auto text-muted/70">＋</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
            <div className="text-sm font-semibold text-fg">暂无匹配</div>
            <div className="mt-2 text-xs leading-6 text-muted/80">换个词试试，或清空检索。</div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
          小提示：这里的筛选沿用上方“洞府层/气象”。你可以先把路缩到一层，再把批注逐条并入札记——久了就成心法。
        </div>
      </Card>
    </div>
  )
}

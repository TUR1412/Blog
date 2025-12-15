import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Compass,
  Download,
  NotebookPen,
  ScrollText,
  Search,
  Trash2,
  Upload,
  Waypoints,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SectionHeading } from '../components/ui/SectionHeading'
import { RELATION_KINDS, relationNodes, type RelationKind } from '../content/relations'
import { TIMELINE_LAYER_META, timeline, timelineLayerLabel, type TimelineLayer } from '../content/timeline'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { hapticSuccess, hapticTap } from '../lib/haptics'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }

type Tone = 'calm' | 'bright' | 'warn'
type ToneFilter = 'all' | Tone
type SourceFilter = 'all' | 'grotto' | 'relations'
type LayerFilter = 'all' | TimelineLayer
type RelationKindFilter = 'all' | RelationKind

type GrottoAnnotation = { text: string; updatedAt: number }
type GrottoAnnotations = Record<string, GrottoAnnotation>

type RelationAnnotation = { text: string; updatedAt: number }
type RelationAnnotations = Record<string, RelationAnnotation>

type AnnotationEntry =
  | {
      source: 'grotto'
      id: string
      title: string
      meta: string
      when: string
      layer: TimelineLayer
      tone: Tone
      chronicleSlug?: string
      updatedAt: number
      text: string
    }
  | {
      source: 'relations'
      id: string
      title: string
      meta: string
      kind: RelationKind
      tone: Tone
      chronicleSlug?: string
      timelineId?: string
      updatedAt: number
      text: string
    }

type AnnotationsHallExportPayload = {
  kind: 'xuantian.annotations.hall'
  v: 1
  exportedAt: number
  count: number
  items: { source: 'grotto' | 'relations'; id: string; text: string; updatedAt: number }[]
}

function safeLower(s: string) {
  return s.toLowerCase()
}

function formatClock(ts: number) {
  if (!ts) return '未落笔'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function toneToken(tone: Tone) {
  if (tone === 'warn') return 'warn'
  if (tone === 'bright') return 'bright'
  return 'calm'
}

export function AnnotationsPage() {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const flashTimerRef = useRef<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const importRef = useRef<HTMLInputElement | null>(null)

  const [grottoAnnotations, setGrottoAnnotations] = useLocalStorageState<GrottoAnnotations>(
    STORAGE_KEYS.grottoAnnotations,
    {},
  )
  const [relationAnnotations, setRelationAnnotations] = useLocalStorageState<RelationAnnotations>(
    STORAGE_KEYS.relationsAnnotations,
    {},
  )

  const [sourceFilter, setSourceFilter] = useLocalStorageState<SourceFilter>(
    STORAGE_KEYS.annotationsHallSource,
    'all',
  )
  const [toneFilter, setToneFilter] = useLocalStorageState<ToneFilter>(STORAGE_KEYS.annotationsHallTone, 'all')
  const [layerFilter, setLayerFilter] = useLocalStorageState<LayerFilter>(STORAGE_KEYS.annotationsHallLayer, 'all')
  const [kindFilter, setKindFilter] = useLocalStorageState<RelationKindFilter>(
    STORAGE_KEYS.annotationsHallKind,
    'all',
  )
  const [query, setQuery] = useState('')

  const flashMessage = (msg: string) => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    setFlash(msg)
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 950)
  }

  const source = useMemo<SourceFilter>(() => {
    if (sourceFilter === 'grotto' || sourceFilter === 'relations' || sourceFilter === 'all') return sourceFilter
    return 'all'
  }, [sourceFilter])

  const tone = useMemo<ToneFilter>(() => {
    if (toneFilter === 'calm' || toneFilter === 'bright' || toneFilter === 'warn' || toneFilter === 'all') return toneFilter
    return 'all'
  }, [toneFilter])

  const layer = useMemo<LayerFilter>(() => {
    if (layerFilter === 'all' || layerFilter === 1 || layerFilter === 2 || layerFilter === 3 || layerFilter === 4)
      return layerFilter
    return 'all'
  }, [layerFilter])

  const relKind = useMemo<RelationKindFilter>(() => {
    if (kindFilter === 'all') return 'all'
    if ((RELATION_KINDS as readonly string[]).includes(kindFilter)) return kindFilter
    return 'all'
  }, [kindFilter])

  const timelineById = useMemo(() => new Map(timeline.map((t) => [t.id, t] as const)), [])
  const relationById = useMemo(() => new Map(relationNodes.map((n) => [n.id, n] as const)), [])

  const canonicalGrottoAnnotations = useMemo<GrottoAnnotations>(() => {
    const next: GrottoAnnotations = {}
    for (const [id, a] of Object.entries(grottoAnnotations)) {
      const t = timelineById.get(id)
      if (!t) continue
      const text = typeof a?.text === 'string' ? a.text.trim() : ''
      if (!text) continue
      const updatedAt = typeof a?.updatedAt === 'number' ? a.updatedAt : 0
      next[id] = { text, updatedAt }
    }
    return next
  }, [grottoAnnotations, timelineById])

  const canonicalRelationAnnotations = useMemo<RelationAnnotations>(() => {
    const next: RelationAnnotations = {}
    for (const [id, a] of Object.entries(relationAnnotations)) {
      const n = relationById.get(id)
      if (!n) continue
      const text = typeof a?.text === 'string' ? a.text.trim() : ''
      if (!text) continue
      const updatedAt = typeof a?.updatedAt === 'number' ? a.updatedAt : 0
      next[id] = { text, updatedAt }
    }
    return next
  }, [relationAnnotations, relationById])

  const grottoCount = useMemo(() => Object.keys(canonicalGrottoAnnotations).length, [canonicalGrottoAnnotations])
  const relationCount = useMemo(
    () => Object.keys(canonicalRelationAnnotations).length,
    [canonicalRelationAnnotations],
  )
  const totalCount = grottoCount + relationCount

  const entries = useMemo<AnnotationEntry[]>(() => {
    const list: AnnotationEntry[] = []

    for (const [id, a] of Object.entries(canonicalGrottoAnnotations)) {
      const t = timelineById.get(id)
      if (!t) continue
      const tone: Tone = (t.tone ?? 'calm') as Tone
      list.push({
        source: 'grotto',
        id,
        title: t.title,
        meta: t.detail,
        when: t.when,
        layer: t.layer,
        tone,
        chronicleSlug: t.chronicleSlug,
        updatedAt: a.updatedAt,
        text: a.text,
      })
    }

    for (const [id, a] of Object.entries(canonicalRelationAnnotations)) {
      const n = relationById.get(id)
      if (!n) continue
      const tone: Tone = (n.tone === 'warn' ? 'warn' : n.tone === 'bright' ? 'bright' : 'calm') as Tone
      list.push({
        source: 'relations',
        id,
        title: n.title,
        meta: n.summary,
        kind: n.kind,
        tone,
        chronicleSlug: n.chronicleSlug,
        timelineId: n.timelineId,
        updatedAt: a.updatedAt,
        text: a.text,
      })
    }

    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return list
  }, [canonicalGrottoAnnotations, canonicalRelationAnnotations, relationById, timelineById])

  const filtered = useMemo(() => {
    const q = safeLower(query.trim())
    return entries.filter((it) => {
      if (source !== 'all' && it.source !== source) return false
      if (tone !== 'all' && it.tone !== tone) return false

      if (it.source === 'grotto') {
        if (layer !== 'all' && it.layer !== layer) return false
      } else {
        if (relKind !== 'all' && it.kind !== relKind) return false
      }

      if (!q) return true
      const hay = safeLower(
        [
          it.source === 'grotto' ? '洞府图' : '关系谱',
          it.title,
          it.meta,
          it.text,
          it.source === 'grotto' ? it.when : it.kind,
        ].join(' '),
      )
      return hay.includes(q)
    })
  }, [entries, layer, query, relKind, source, tone])

  const exportScroll = () => {
    if (filtered.length === 0) {
      window.alert('当前筛选下没有可导出的批注。')
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const sourceLabel = source === 'grotto' ? '洞府图' : source === 'relations' ? '关系谱' : '全站'

    const lines: string[] = [
      '轩天帝 · 批注馆文卷',
      `导出时间：${stamp} ${clock}`,
      `范围：${sourceLabel}`,
      `气象：${tone === 'all' ? '全部' : tone === 'warn' ? '警' : tone === 'bright' ? '明' : '平'}`,
      `洞府层：${layer === 'all' ? '全部' : TIMELINE_LAYER_META[layer].label}`,
      `关系类别：${relKind === 'all' ? '全部' : relKind}`,
      `共计：${filtered.length} 条`,
      '',
    ]

    for (const it of filtered) {
      if (it.source === 'grotto') {
        lines.push(`【洞府批注】${timelineLayerLabel(it.layer)} · ${it.when} · ${it.title}`)
        const parts = it.text.split(/\r?\n/).map((x) => x.trimEnd())
        if (parts.length <= 1) {
          lines.push(`批注：${(parts[0] ?? '').trim()}`)
        } else {
          lines.push('批注：')
          for (const p of parts) lines.push(`  ${p}`)
        }
        lines.push(`定位：/grotto?id=${it.id}`)
        lines.push('')
        continue
      }

      lines.push(`【关系批注】${it.kind} · ${it.title}`)
      const parts = it.text.split(/\r?\n/).map((x) => x.trimEnd())
      if (parts.length <= 1) {
        lines.push(`批注：${(parts[0] ?? '').trim()}`)
      } else {
        lines.push('批注：')
        for (const p of parts) lines.push(`  ${p}`)
      }
      lines.push(`定位：/relations?id=${it.id}`)
      lines.push('')
    }

    const text = `${lines.join('\n').trimEnd()}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-annotations-hall-${stamp}.txt`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已导出文卷。')
  }

  const exportArchive = () => {
    if (filtered.length === 0) {
      window.alert('当前筛选下没有可导出的批注。')
      return
    }

    const payload: AnnotationsHallExportPayload = {
      kind: 'xuantian.annotations.hall',
      v: 1,
      exportedAt: Date.now(),
      count: filtered.length,
      items: filtered.map((it) => ({ source: it.source, id: it.id, text: it.text, updatedAt: it.updatedAt })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-annotations-hall-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已导出存档。')
  }

  const applyImported = (items: AnnotationsHallExportPayload['items']) => {
    const grottoIncoming: GrottoAnnotations = {}
    const relationIncoming: RelationAnnotations = {}

    for (const it of items) {
      const text = typeof it.text === 'string' ? it.text.trim() : ''
      if (!text) continue
      const updatedAt = typeof it.updatedAt === 'number' ? it.updatedAt : Date.now()

      if (it.source === 'grotto') {
        if (!timelineById.has(it.id)) continue
        grottoIncoming[it.id] = { text, updatedAt }
      } else {
        if (!relationById.has(it.id)) continue
        relationIncoming[it.id] = { text, updatedAt }
      }
    }

    const count = Object.keys(grottoIncoming).length + Object.keys(relationIncoming).length
    if (count === 0) {
      window.alert('导入失败：存档里没有可识别的批注。')
      return
    }

    const replace = window.confirm('导入方式：确定=覆盖现有两类批注；取消=合并（同一条以导入为准）。')
    if (replace) {
      setGrottoAnnotations(grottoIncoming)
      setRelationAnnotations(relationIncoming)
    } else {
      setGrottoAnnotations((prev) => ({ ...prev, ...grottoIncoming }))
      setRelationAnnotations((prev) => ({ ...prev, ...relationIncoming }))
    }

    hapticSuccess()
    flashMessage(`已导入批注：${count} 条。`)
  }

  const importArchive = async (file: File) => {
    try {
      const raw = await file.text()
      const data = JSON.parse(raw) as unknown
      if (!data || typeof data !== 'object') {
        window.alert('导入失败：存档格式不支持。')
        return
      }

      const maybe = data as Partial<AnnotationsHallExportPayload> & { items?: unknown }
      if (maybe.kind === 'xuantian.annotations.hall' && maybe.v === 1 && Array.isArray(maybe.items)) {
        const items = maybe.items.filter((x) => x && typeof x === 'object') as AnnotationsHallExportPayload['items']
        applyImported(items)
        return
      }

      window.alert('导入失败：此文件不是“批注馆存档”。')
    } catch {
      window.alert('导入失败：存档内容有误。')
    }
  }

  const appendEntryToNotes = (it: AnnotationEntry) => {
    const ann = it.text.trim()
    if (!ann) {
      window.alert('此处尚未落笔。')
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    const block =
      it.source === 'grotto'
        ? [
            `【${stamp} · 路标批注】`,
            `${timelineLayerLabel(it.layer)} · ${it.when} · ${it.title}`,
            `“${ann}”`,
            `（来源：批注馆 · 洞府图 · ${it.title}）`,
          ].join('\n')
        : [
            `【${stamp} · 关系谱批注】`,
            `${it.kind} · ${it.title}`,
            it.meta,
            `“${ann}”`,
            `（来源：批注馆 · 关系谱 · ${it.title}）`,
          ].join('\n')

    const prev = readString(STORAGE_KEYS.notes, '')
    const next = prev.trim() ? `${prev}\n\n${block}` : block
    writeString(STORAGE_KEYS.notes, next)

    const prevMeta = readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 })
    const nextMeta: NotesMeta = {
      ...prevMeta,
      updatedAt: now.getTime(),
      lastSource: it.source === 'grotto' ? `批注馆 · 洞府图：${it.title}` : `批注馆 · 关系谱：${it.title}`,
    }
    writeJson(STORAGE_KEYS.notesMeta, nextMeta)

    hapticSuccess()
    flashMessage('已并入札记。')
  }

  const locateEntry = (it: AnnotationEntry) => {
    if (it.source === 'grotto') {
      navigate(`/grotto?id=${it.id}`)
      hapticTap()
      return
    }
    navigate(`/relations?id=${it.id}`)
    hapticTap()
  }

  const clearEntry = (it: AnnotationEntry) => {
    const ok = window.confirm('确定清空这条批注？')
    if (!ok) return

    if (it.source === 'grotto') {
      setGrottoAnnotations((prev) => {
        const next = { ...prev }
        delete next[it.id]
        return next
      })
    } else {
      setRelationAnnotations((prev) => {
        const next = { ...prev }
        delete next[it.id]
        return next
      })
    }

    hapticTap()
    flashMessage('已清空。')
  }

      return (
        <div className="space-y-6">
      <Card className="relative overflow-hidden p-7 md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.36),transparent_62%)] blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.30),transparent_62%)] blur-3xl" />

        <div className="relative">
          <Badge className="mb-4">批注馆</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">把分寸摊开，才知道路走稳了没有</h2>
          <p className="mt-3 max-w-[92ch] text-sm leading-7 text-muted/85">
            洞府图的“路标批注”，与关系谱的“节点批注”，都汇在这里：不为热闹，只为复盘。你写下的每一句，都能定位回原处，也能一键并入札记。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/grotto" variant="ghost">
              去洞府图 <Compass className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/relations" variant="ghost">
              去关系谱 <Waypoints className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/notes" variant="ghost">
              去札记 <NotebookPen className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <SectionHeading title="筛选与收纳" subtitle="少动手，多归拢；归拢之后才好对照。" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
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
                  if (e.key === 'Escape') setQuery('')
                }}
                placeholder="搜：分寸 / 规矩 / 断桥 / 细则……（Esc 清空）"
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
                  ×
                </button>
              ) : null}
            </div>

            <div className="text-xs text-muted/70 sm:shrink-0 lg:shrink-0">
              命中 {filtered.length} / 共 {totalCount}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xs text-muted/70">来源</div>
              <Chip selected={source === 'all'} onClick={() => setSourceFilter('all')}>
                全站
              </Chip>
              <Chip selected={source === 'grotto'} onClick={() => setSourceFilter('grotto')}>
                洞府图
              </Chip>
              <Chip selected={source === 'relations'} onClick={() => setSourceFilter('relations')}>
                关系谱
              </Chip>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted/70">气象</div>
              <Chip selected={tone === 'all'} onClick={() => setToneFilter('all')}>
                全部
              </Chip>
              <Chip selected={tone === 'calm'} onClick={() => setToneFilter('calm')}>
                平
              </Chip>
              <Chip selected={tone === 'bright'} onClick={() => setToneFilter('bright')}>
                明
              </Chip>
              <Chip selected={tone === 'warn'} onClick={() => setToneFilter('warn')}>
                警
              </Chip>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted/70">洞府层</div>
              <Chip selected={layer === 'all'} onClick={() => setLayerFilter('all')}>
                全部
              </Chip>
              {([1, 2, 3, 4] as TimelineLayer[]).map((layerValue) => (
                <Chip
                  key={String(layerValue)}
                  selected={layer === layerValue}
                  onClick={() => setLayerFilter(layerValue)}
                >
                  {TIMELINE_LAYER_META[layerValue].label}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-muted/70">关系类</div>
              <Chip selected={relKind === 'all'} onClick={() => setKindFilter('all')}>
                全部
              </Chip>
              {RELATION_KINDS.map((k) => (
                <Chip key={k} selected={relKind === k} onClick={() => setKindFilter(k)}>
                  {k}
                </Chip>
              ))}
            </div>
          </div>

          <input
            ref={importRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              e.currentTarget.value = ''
              if (!file) return
              void importArchive(file)
            }}
          />

          <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-fg">导出与迁移</div>
              <div className="text-xs text-muted/70">洞府 {grottoCount} · 关系 {relationCount}</div>
            </div>
            <div className="mt-2 text-xs leading-6 text-muted/80">
              文卷适合阅读与留档；存档可导入，适合换设备或清理缓存前备份。
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button type="button" variant="ghost" onClick={exportScroll} className="justify-start" disabled={!filtered.length}>
                <ScrollText className="h-4 w-4" />
                导出文卷（当前筛选）
                <span className="ml-auto text-muted/70">↓</span>
              </Button>
              <Button type="button" variant="ghost" onClick={exportArchive} className="justify-start" disabled={!filtered.length}>
                <Download className="h-4 w-4" />
                导出存档（当前筛选）
                <span className="ml-auto text-muted/70">↓</span>
              </Button>
              <Button type="button" variant="ghost" onClick={() => importRef.current?.click()} className="justify-start">
                <Upload className="h-4 w-4" />
                导入存档
                <span className="ml-auto text-muted/70">↑</span>
              </Button>
            </div>
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
        </Card>

        <div className="grid gap-4 lg:col-span-8">
          <Card className="relative overflow-hidden">
            <SectionHeading title="批注条目" subtitle="每条都可定位回原处，也可一键并入札记。" />

            {filtered.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {filtered.map((it, idx) => {
                  const tone = toneToken(it.tone)
                  const label = it.source === 'grotto' ? '洞府图' : '关系谱'
                  const sub =
                    it.source === 'grotto'
                      ? `${timelineLayerLabel(it.layer)} · ${it.when}`
                      : `${it.kind} · ${it.meta}`

                  return (
                    <motion.div
                      key={`${it.source}:${it.id}`}
                      className="rounded-xl border border-border/60 bg-white/4 px-5 py-4"
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : idx * 0.015, type: 'spring', stiffness: 420, damping: 34 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{label}</Badge>
                            <span className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-[11px] text-muted/80">
                              {tone === 'warn' ? '警' : tone === 'bright' ? '明' : '平'}
                            </span>
                            <span className="text-xs text-muted/70">最近：{formatClock(it.updatedAt)}</span>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-fg">{it.title}</div>
                          <div className="mt-1 line-clamp-2 text-xs leading-6 text-muted/80">{sub}</div>
                        </div>
                      </div>

                      <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-sm leading-7 text-fg/90">
                        {it.text}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <Button type="button" variant="ghost" onClick={() => locateEntry(it)} className="justify-start">
                          <Compass className="h-4 w-4" />
                          定位
                          <span className="ml-auto text-muted/70">→</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => appendEntryToNotes(it)}
                          className="justify-start"
                        >
                          <NotebookPen className="h-4 w-4" />
                          并入札记
                          <span className="ml-auto text-muted/70">＋</span>
                        </Button>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {it.chronicleSlug ? (
                          <Link
                            to={`/chronicles/${it.chronicleSlug}`}
                            className="focus-ring tap inline-flex items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-4 py-2 text-sm font-medium text-fg/90 hover:bg-white/10"
                          >
                            <BookOpen className="h-4 w-4" />
                            去读纪事
                            <span className="ml-auto text-muted/70">→</span>
                          </Link>
                        ) : (
                          <div className="rounded-xl border border-border/60 bg-white/3 px-4 py-2 text-xs text-muted/70">
                            暂无对应纪事
                          </div>
                        )}

                        <Button type="button" variant="outline" onClick={() => clearEntry(it)} className="justify-start">
                          <Trash2 className="h-4 w-4" />
                          清空
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
                <div className="text-sm font-semibold text-fg">暂无批注</div>
                <div className="mt-2 text-xs leading-6 text-muted/80">
                  若你刚开始写，先去洞府图或关系谱落笔一两句；写下分寸，才算把路走稳。
                </div>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <ButtonLink to="/grotto" variant="ghost">
                    去洞府图
                  </ButtonLink>
                  <ButtonLink to="/relations" variant="ghost">
                    去关系谱
                  </ButtonLink>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

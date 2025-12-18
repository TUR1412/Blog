import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  BookOpen,
  Compass,
  Download,
  Map as MapIcon,
  NotebookPen,
  RotateCcw,
  ScrollText,
  Search,
  Trash2,
  Upload,
  Waypoints,
} from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS, type MarkdownHighlightOptions, Markdown } from '../components/content/Markdown'
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
import { prefetchIntent } from '../routes/prefetch'

type NotesMeta = { updatedAt: number; lastSource?: string }

type Tone = 'calm' | 'bright' | 'warn'
type ToneFilter = 'all' | Tone
type SourceFilter = 'all' | 'grotto' | 'relations'
type LayerFilter = 'all' | TimelineLayer
type RelationKindFilter = 'all' | RelationKind
type FindOptions = Required<MarkdownHighlightOptions>

type GrottoAnnotation = { text: string; updatedAt: number }
type GrottoAnnotations = Record<string, GrottoAnnotation>

type RelationAnnotation = { text: string; updatedAt: number }
type RelationAnnotations = Record<string, RelationAnnotation>

type AnnotationsHallUndoPayload = {
  kind: 'xuantian.annotations.hall.undo'
  v: 1
  savedAt: number
  note: string
  grotto: GrottoAnnotations
  relations: RelationAnnotations
}

type AnnotationsHallBackupPayload = {
  kind: 'xuantian.annotations.hall.backup'
  v: 1
  savedAt: number
  reason: string
  grotto: GrottoAnnotations
  relations: RelationAnnotations
}

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
      searchHay: string
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
      searchHay: string
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

function formatDateTime(ts: number) {
  if (!ts) return '未落笔'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
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
  const hallRef = useRef<HTMLDivElement | null>(null)
  const [findQuery, setFindQuery] = useState('')
  const [findOptions, setFindOptions] = useLocalStorageState<FindOptions>(
    STORAGE_KEYS.findOptions,
    DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS,
  )
  const [hitCount, setHitCount] = useState(0)
  const [activeHitIndex, setActiveHitIndex] = useState(0)
  const [activeEntryKey, setActiveEntryKey] = useState('')

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
  const [undo, setUndo] = useLocalStorageState<AnnotationsHallUndoPayload | null>(STORAGE_KEYS.annotationsHallUndo, null)
  const [backup, setBackup] = useLocalStorageState<AnnotationsHallBackupPayload | null>(
    STORAGE_KEYS.annotationsHallBackup,
    null,
  )
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const appliedQuery = query.trim() ? deferredQuery : ''

  const deferredFindQuery = useDeferredValue(findQuery)
  const appliedFindQuery = findQuery.trim() ? deferredFindQuery : ''

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

  const relationNodeIdForTimelineId = useMemo(() => {
    const map = new Map<string, string>()
    for (const n of relationNodes) {
      if (!n.timelineId) continue
      if (n.id === n.timelineId) map.set(n.timelineId, n.id)
    }
    for (const n of relationNodes) {
      if (!n.timelineId) continue
      if (map.has(n.timelineId)) continue
      map.set(n.timelineId, n.id)
    }
    return map
  }, [])

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
      const searchHay = safeLower(['洞府图', t.title, t.detail, a.text, t.when, timelineLayerLabel(t.layer)].join(' '))
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
        searchHay,
      })
    }

    for (const [id, a] of Object.entries(canonicalRelationAnnotations)) {
      const n = relationById.get(id)
      if (!n) continue
      const tone: Tone = (n.tone === 'warn' ? 'warn' : n.tone === 'bright' ? 'bright' : 'calm') as Tone
      const searchHay = safeLower(['关系谱', n.title, n.summary, a.text, n.kind].join(' '))
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
        searchHay,
      })
    }

    list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return list
  }, [canonicalGrottoAnnotations, canonicalRelationAnnotations, relationById, timelineById])

  const filtered = useMemo(() => {
    const q = safeLower(appliedQuery.trim())
    return entries.filter((it) => {
      if (source !== 'all' && it.source !== source) return false
      if (tone !== 'all' && it.tone !== tone) return false

      if (it.source === 'grotto') {
        if (layer !== 'all' && it.layer !== layer) return false
      } else {
        if (relKind !== 'all' && it.kind !== relKind) return false
      }

      if (!q) return true
      return it.searchHay.includes(q)
    })
  }, [appliedQuery, entries, layer, relKind, source, tone])

  const heavyList = filtered.length > 80
  const enableHallMotion = !reduceMotion && !heavyList && filtered.length <= 48

  const hitTrackKey = useMemo(() => {
    if (!appliedFindQuery.trim()) return ''
    const flags = `mc:${findOptions.matchCase ? 1 : 0};ww:${findOptions.wholeWord ? 1 : 0};ip:${
      findOptions.ignorePunctuation ? 1 : 0
    }`
    return `${flags}|${filtered.map((it) => `${it.source}:${it.id}:${it.updatedAt}`).join('|')}`
  }, [appliedFindQuery, filtered, findOptions.ignorePunctuation, findOptions.matchCase, findOptions.wholeWord])

  const activeEntry = useMemo(() => {
    if (!activeEntryKey) return null
    return filtered.find((it) => `${it.source}:${it.id}` === activeEntryKey) ?? null
  }, [activeEntryKey, filtered])

  const getMarks = useCallback(() => {
    const root = hallRef.current
    if (!root) return [] as HTMLElement[]
    return Array.from(root.querySelectorAll('mark[data-x-hit="hall"]')) as HTMLElement[]
  }, [])

  const syncActiveMark = useCallback(
    (idx: number, scroll: boolean) => {
      const marks = getMarks()
      for (const el of marks) el.removeAttribute('data-x-active')
      const active = marks[idx]
      if (!active) {
        setActiveEntryKey('')
        return
      }
      active.setAttribute('data-x-active', '1')
      const entry = active.closest('[data-hall-entry]') as HTMLElement | null
      setActiveEntryKey(entry?.getAttribute('data-hall-entry') ?? '')
      if (scroll) active.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    },
    [getMarks, reduceMotion, setActiveEntryKey],
  )

  const jumpToHit = (targetIndex: number) => {
    const inputQ = findQuery.trim()
    const q = appliedFindQuery.trim()
    if (!inputQ) {
      flashMessage('先写一个卷内检索词。')
      hapticTap()
      return
    }
    if (!q) {
      flashMessage('检索词正在点亮，稍等一息再跳。')
      hapticTap()
      return
    }
    if (!hitCount) {
      flashMessage('未命中。')
      hapticTap()
      return
    }

    const next = ((targetIndex % hitCount) + hitCount) % hitCount
    setActiveHitIndex(next)
    window.setTimeout(() => syncActiveMark(next, true), 0)
    hapticTap()
  }

  const toggleFindOption = (key: keyof FindOptions) => {
    setFindOptions((prev) => ({ ...prev, [key]: !prev[key] }))
    hapticTap()
  }

  const scrollToActiveEntry = () => {
    if (!activeEntryKey) return
    const root = hallRef.current
    if (!root) return
    const el = root.querySelector(`[data-hall-entry="${activeEntryKey}"]`) as HTMLElement | null
    if (!el) return
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    hapticTap()
  }

  useEffect(() => {
    const t = window.setTimeout(() => setActiveHitIndex(0), 0)
    return () => window.clearTimeout(t)
  }, [findOptions, findQuery])

  useEffect(() => {
    const t = window.setTimeout(() => {
      const q = appliedFindQuery.trim()
      if (!q) {
        setHitCount(0)
        setActiveHitIndex(0)
        setActiveEntryKey('')
        return
      }

      const marks = getMarks()
      const nextCount = marks.length
      setHitCount(nextCount)

      if (!nextCount) {
        setActiveHitIndex(0)
        setActiveEntryKey('')
        return
      }

      setActiveHitIndex((prev) => Math.min(prev, nextCount - 1))
    }, 0)
    return () => window.clearTimeout(t)
  }, [appliedFindQuery, getMarks, hitTrackKey])

  useEffect(() => {
    const q = appliedFindQuery.trim()
    if (!q) return
    const t = window.setTimeout(() => {
      const marks = getMarks()
      const nextCount = marks.length
      if (!nextCount) return
      const idx = Math.max(0, Math.min(activeHitIndex, nextCount - 1))
      syncActiveMark(idx, false)
    }, 0)
    return () => window.clearTimeout(t)
  }, [activeHitIndex, appliedFindQuery, getMarks, hitTrackKey, syncActiveMark])

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

  const exportSealedBook = () => {
    if (totalCount === 0) {
      window.alert('当前没有可导出的批注。')
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const lines: string[] = [
      '轩天帝 · 批注馆封印卷',
      `导出时间：${stamp} ${clock}`,
      `洞府批注：${grottoCount} 处`,
      `关系批注：${relationCount} 处`,
      '',
      '【洞府卷】（按洞府层分卷）',
      '',
    ]

    for (const layerValue of [1, 2, 3, 4] as TimelineLayer[]) {
      const layerMeta = TIMELINE_LAYER_META[layerValue]
      lines.push(`【${layerMeta.label}】${layerMeta.hint}`)
      const any = timeline.some((t) => t.layer === layerValue && Boolean(canonicalGrottoAnnotations[t.id]))
      if (!any) {
        lines.push('（此卷暂无批注）')
        lines.push('')
        continue
      }

      for (const t of timeline) {
        if (t.layer !== layerValue) continue
        const ann = canonicalGrottoAnnotations[t.id]
        if (!ann) continue
        const tone = (t.tone ?? 'calm') as Tone
        lines.push(`- ${t.when} · ${t.title}（${tone === 'warn' ? '警' : tone === 'bright' ? '明' : '平'}）`)
        const parts = ann.text.split(/\r?\n/).map((x) => x.trimEnd())
        if (parts.length <= 1) {
          lines.push(`  批注：${(parts[0] ?? '').trim()}`)
        } else {
          lines.push('  批注：')
          for (const p of parts) lines.push(`    ${p}`)
        }
        lines.push(`  最近：${formatDateTime(ann.updatedAt)}`)
        lines.push(`  定位：/grotto?id=${t.id}`)
        lines.push('')
      }
    }

    lines.push('【关系卷】（按关系类分卷）')
    lines.push('')

    for (const k of RELATION_KINDS) {
      lines.push(`【${k}】`)
      const nodes = relationNodes
        .filter((n) => n.kind === k && Boolean(canonicalRelationAnnotations[n.id]))
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))

      if (nodes.length === 0) {
        lines.push('（此卷暂无批注）')
        lines.push('')
        continue
      }

      for (const n of nodes) {
        const ann = canonicalRelationAnnotations[n.id]
        if (!ann) continue
        const tone = (n.tone === 'warn' ? 'warn' : n.tone === 'bright' ? 'bright' : 'calm') as Tone
        lines.push(`- ${n.title}（${tone === 'warn' ? '警' : tone === 'bright' ? '明' : '平'}）`)
        lines.push(`  摘要：${n.summary}`)

        const parts = ann.text.split(/\r?\n/).map((x) => x.trimEnd())
        if (parts.length <= 1) {
          lines.push(`  批注：${(parts[0] ?? '').trim()}`)
        } else {
          lines.push('  批注：')
          for (const p of parts) lines.push(`    ${p}`)
        }

        if (n.timelineId && timelineById.has(n.timelineId)) {
          const t = timelineById.get(n.timelineId)
          lines.push(`  对应路标：${t ? `${timelineLayerLabel(t.layer)} · ${t.when} · ${t.title}` : n.timelineId}`)
          lines.push(`  定位：/grotto?id=${n.timelineId}`)
        }

        if (n.chronicleSlug) {
          lines.push(`  对应纪事：/chronicles/${n.chronicleSlug}`)
        }

        lines.push(`  最近：${formatDateTime(ann.updatedAt)}`)
        lines.push(`  定位：/relations?id=${n.id}`)
        lines.push('')
      }
    }

    const text = `${lines.join('\n').trimEnd()}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-annotations-seal-${stamp}.txt`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已封印整卷。')
  }

  const applyImported = (items: AnnotationsHallExportPayload['items']) => {
    const grottoIncoming: GrottoAnnotations = {}
    const relationIncoming: RelationAnnotations = {}
    let skipped = 0

    for (const it of items) {
      if (!it || typeof it !== 'object') {
        skipped += 1
        continue
      }

      const text = typeof it.text === 'string' ? it.text.trim() : ''
      if (!text) {
        skipped += 1
        continue
      }
      const updatedAt = typeof it.updatedAt === 'number' ? it.updatedAt : 0

      if (it.source === 'grotto') {
        if (!timelineById.has(it.id)) {
          skipped += 1
          continue
        }
        grottoIncoming[it.id] = { text, updatedAt }
        continue
      }

      if (it.source === 'relations') {
        if (!relationById.has(it.id)) {
          skipped += 1
          continue
        }
        relationIncoming[it.id] = { text, updatedAt }
        continue
      }

      skipped += 1
    }

    const grottoIncomingCount = Object.keys(grottoIncoming).length
    const relationIncomingCount = Object.keys(relationIncoming).length
    const count = grottoIncomingCount + relationIncomingCount
    if (count === 0) {
      window.alert('导入失败：存档里没有可识别的批注。')
      return
    }

    const diff = (incoming: Record<string, { text: string }>, current: Record<string, { text: string }>) => {
      let add = 0
      let update = 0
      let same = 0
      for (const [id, a] of Object.entries(incoming)) {
        const prev = current[id]?.text?.trim() ?? ''
        if (!prev) add += 1
        else if (prev === a.text.trim()) same += 1
        else update += 1
      }
      return { add, update, same }
    }

    const grottoDiff = diff(grottoIncoming, canonicalGrottoAnnotations)
    const relationDiff = diff(relationIncoming, canonicalRelationAnnotations)

    const previewLines = [
      '导入预览（批注馆）',
      '',
      `洞府：新增 ${grottoDiff.add} · 覆盖 ${grottoDiff.update} · 无变化 ${grottoDiff.same}（有效 ${grottoIncomingCount}）`,
      `关系：新增 ${relationDiff.add} · 覆盖 ${relationDiff.update} · 无变化 ${relationDiff.same}（有效 ${relationIncomingCount}）`,
      skipped ? `跳过：${skipped} 条（空内容/未知节点/格式不符）` : null,
      '',
      '确定：继续导入',
      '取消：放弃导入',
    ].filter((x): x is string => typeof x === 'string')

    const proceed = window.confirm(previewLines.join('\n'))
    if (!proceed) return

    stashBackup('导入存档（批注馆）')

    const modeLines = [
      '导入方式选择',
      '',
      '确定：覆盖（只保留导入内容；未包含的批注会被清掉）',
      '取消：合并（保留现有批注；同一条以导入为准）',
    ]
    const replace = window.confirm(modeLines.join('\n'))

    if (replace) {
      setGrottoAnnotations(grottoIncoming)
      setRelationAnnotations(relationIncoming)
      hapticSuccess()
      flashMessage(`已覆盖导入：洞府 ${grottoIncomingCount} · 关系 ${relationIncomingCount}。`)
      return
    }

    setGrottoAnnotations((prev) => ({ ...prev, ...grottoIncoming }))
    setRelationAnnotations((prev) => ({ ...prev, ...relationIncoming }))
    hapticSuccess()
    flashMessage(`已合并导入：洞府 ${grottoIncomingCount} · 关系 ${relationIncomingCount}。`)
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

  const stashBackup = (reason: string) => {
    setBackup({
      kind: 'xuantian.annotations.hall.backup',
      v: 1,
      savedAt: Date.now(),
      reason,
      grotto: { ...grottoAnnotations },
      relations: { ...relationAnnotations },
    })
  }

  const stashUndo = (note: string) => {
    setUndo({
      kind: 'xuantian.annotations.hall.undo',
      v: 1,
      savedAt: Date.now(),
      note,
      grotto: { ...grottoAnnotations },
      relations: { ...relationAnnotations },
    })
  }

  const cleanEmptyAnnotations = () => {
    const purify = (raw: Record<string, { text?: unknown; updatedAt?: unknown }>) => {
      const next: Record<string, { text: string; updatedAt: number }> = {}
      let removed = 0
      let kept = 0
      for (const [id, a] of Object.entries(raw)) {
        const text = typeof a?.text === 'string' ? a.text.trim() : ''
        if (!text) {
          removed += 1
          continue
        }
        const updatedAt = typeof a?.updatedAt === 'number' ? a.updatedAt : 0
        next[id] = { text, updatedAt }
        kept += 1
      }
      return { next, removed, kept }
    }

    const grotto = purify(grottoAnnotations as unknown as Record<string, { text?: unknown; updatedAt?: unknown }>)
    const relations = purify(relationAnnotations as unknown as Record<string, { text?: unknown; updatedAt?: unknown }>)

    const totalRemoved = grotto.removed + relations.removed
    if (totalRemoved === 0) {
      flashMessage('无需清心：未发现空批注残留。')
      hapticTap()
      return
    }

    const ok = window.confirm(
      [
        '清心诀：剔除空批注',
        '',
        `洞府：剔除 ${grotto.removed} · 留存 ${grotto.kept}`,
        `关系：剔除 ${relations.removed} · 留存 ${relations.kept}`,
        '',
        '确定：施诀',
        '取消：作罢',
      ].join('\n'),
    )
    if (!ok) return

    stashBackup('清心诀：剔除空批注')
    stashUndo('剔除空批注')
    setGrottoAnnotations(grotto.next)
    setRelationAnnotations(relations.next)
    hapticSuccess()
    flashMessage(`清心诀已成：剔除 ${totalRemoved} 条空批注（可撤销）。`)
  }

  const clearSourceAnnotations = (source: 'grotto' | 'relations') => {
    const label = source === 'grotto' ? '洞府图' : '关系谱'
    const rawCount = source === 'grotto' ? Object.keys(grottoAnnotations).length : Object.keys(relationAnnotations).length
    const liveCount = source === 'grotto' ? grottoCount : relationCount

    if (rawCount === 0) {
      flashMessage(`无需清空：${label}暂无批注。`)
      hapticTap()
      return
    }

    const ok = window.confirm(
      [
        `清心诀：清空${label}批注`,
        '',
        `有效批注：${liveCount} 条`,
        `本地存量：${rawCount} 条`,
        '',
        '确定：清空（可撤销）',
        '取消：作罢',
      ].join('\n'),
    )
    if (!ok) return

    stashBackup(`清心诀：清空${label}批注`)
    stashUndo(`清空${label}批注`)
    if (source === 'grotto') setGrottoAnnotations({})
    else setRelationAnnotations({})
    hapticSuccess()
    flashMessage(`已清空${label}批注（可撤销）。`)
  }

  const undoLastOperation = () => {
    if (!undo || undo.kind !== 'xuantian.annotations.hall.undo' || undo.v !== 1) {
      flashMessage('没有可撤销的回退印记。')
      hapticTap()
      return
    }

    const ok = window.confirm(
      [
        '回退印记：撤销上次变更',
        '',
        `上次变更：${undo.note}`,
        `落印时间：${formatDateTime(undo.savedAt)}`,
        '',
        '确定：撤销',
        '取消：作罢',
      ].join('\n'),
    )
    if (!ok) return

    setGrottoAnnotations(undo.grotto ?? {})
    setRelationAnnotations(undo.relations ?? {})
    setUndo(null)
    hapticSuccess()
    flashMessage('已撤销上次变更。')
  }

  const downloadBackup = () => {
    if (!backup || backup.kind !== 'xuantian.annotations.hall.backup' || backup.v !== 1) {
      flashMessage('暂无可下载的护卷符快照。')
      hapticTap()
      return
    }

    const d = new Date(backup.savedAt || Date.now())
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const clock = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-annotations-backup-${stamp}-${clock}.json`
    a.click()
    URL.revokeObjectURL(url)
    hapticSuccess()
    flashMessage('已下载护卷符快照。')
  }

  const restoreFromBackup = () => {
    if (!backup || backup.kind !== 'xuantian.annotations.hall.backup' || backup.v !== 1) {
      flashMessage('暂无可用的护卷符快照。')
      hapticTap()
      return
    }

    const countValid = (raw: Record<string, { text?: unknown }>) =>
      Object.values(raw).reduce((acc, a) => acc + (typeof a?.text === 'string' && a.text.trim() ? 1 : 0), 0)

    const backupGrottoCount = countValid(backup.grotto as unknown as Record<string, { text?: unknown }>)
    const backupRelationCount = countValid(backup.relations as unknown as Record<string, { text?: unknown }>)

    const ok = window.confirm(
      [
        '回魂灯：从护卷符恢复',
        '',
        '将用护卷符快照覆盖当前批注馆（洞府 + 关系）。',
        `护卷符：${backup.reason} · ${formatDateTime(backup.savedAt)}`,
        '',
        `快照有效：洞府 ${backupGrottoCount} · 关系 ${backupRelationCount}`,
        `当前有效：洞府 ${grottoCount} · 关系 ${relationCount}`,
        '',
        '确定：恢复（可撤销）',
        '取消：作罢',
      ].join('\n'),
    )
    if (!ok) return

    stashUndo(`回魂灯：恢复前（${backup.reason}）`)
    setGrottoAnnotations(backup.grotto ?? {})
    setRelationAnnotations(backup.relations ?? {})
    hapticSuccess()
    flashMessage('已从护卷符恢复（可撤销）。')
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
            洞府图的“路标批注”，与关系谱的“节点批注”，都汇在这里：不为热闹，只为复盘。写下的每一句，都能定位回原处，也能一键并入札记。
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
              {query.trim() && query.trim() !== appliedQuery.trim() ? '检索中…' : `命中 ${filtered.length} / 共 ${totalCount}`}
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-fg">卷内检索</div>
              {findQuery.trim() ? (
                <div className="text-xs text-muted/70">
                  {findQuery.trim() !== appliedFindQuery.trim()
                    ? '点亮中…'
                    : hitCount
                      ? `${Math.min(activeHitIndex + 1, hitCount)}/${hitCount}`
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
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setFindQuery('')
                  if (e.key === 'Enter') jumpToHit(0)
                }}
                placeholder="搜卷内：只标亮批注正文（Enter 跳首处，Esc 清空）"
                className="w-full bg-transparent text-sm text-fg placeholder:text-muted/70 focus:outline-none"
              />
              {findQuery.trim() ? (
                <button
                  type="button"
                  className="focus-ring tap inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-fg/90 hover:bg-white/10"
                  onClick={() => setFindQuery('')}
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
                  hitCount ? 'bg-white/5 text-fg/90 hover:bg-white/10' : 'bg-white/3 text-muted/60',
                )}
                onClick={() => jumpToHit(activeHitIndex - 1)}
                disabled={!hitCount}
              >
                上一处 <span className="text-muted/70">↑</span>
              </button>
              <button
                type="button"
                className={cn(
                  'focus-ring tap inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-2 text-xs font-medium',
                  hitCount ? 'bg-white/5 text-fg/90 hover:bg-white/10' : 'bg-white/3 text-muted/60',
                )}
                onClick={() => jumpToHit(activeHitIndex + 1)}
                disabled={!hitCount}
              >
                下一处 <span className="text-muted/70">↓</span>
              </button>
            </div>

            {appliedFindQuery.trim() ? (
              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted/75">
                <div className="min-w-0 truncate">
                  当前命中：
                  <span className="text-fg/85">
                    {activeEntry
                      ? `${activeEntry.source === 'grotto' ? '洞府图' : '关系谱'} · ${activeEntry.title}`
                      : '—'}
                  </span>
                </div>
                <button
                  type="button"
                  className={cn(
                    'focus-ring tap inline-flex items-center justify-center gap-2 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium',
                    activeEntryKey ? 'bg-white/5 text-fg/90 hover:bg-white/10' : 'bg-white/3 text-muted/60',
                  )}
                  onClick={scrollToActiveEntry}
                  disabled={!activeEntryKey}
                >
                  回到条目
                  <span className="text-muted/70">↘</span>
                </button>
              </div>
            ) : null}

            <div className="mt-2 text-xs leading-6 text-muted/75">
              不影响筛选，只在右侧“批注条目”正文里标亮命中。
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
              <Button
                type="button"
                variant="ghost"
                onClick={exportSealedBook}
                className="justify-start"
                disabled={totalCount === 0}
              >
                <ScrollText className="h-4 w-4" />
                封印整卷（全站）
                <span className="ml-auto text-muted/70">↓</span>
              </Button>
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

          <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-fg">清心诀</div>
              <div className="text-xs text-muted/70">留印可撤销</div>
            </div>
            <div className="mt-2 text-xs leading-6 text-muted/80">
              导入存档或施诀前会自动落下一枚“护卷符快照”，可一键下载备份；回魂灯会用它覆盖当前批注，并生成“恢复前”回退印记。
            </div>

            {backup && backup.kind === 'xuantian.annotations.hall.backup' && backup.v === 1 ? (
              <div className="mt-2 text-xs text-muted/75">
                护卷符：{backup.reason} · {formatDateTime(backup.savedAt)}
              </div>
            ) : (
              <div className="mt-2 text-xs text-muted/75">护卷符：暂无</div>
            )}

            {undo && undo.kind === 'xuantian.annotations.hall.undo' && undo.v === 1 ? (
              <div className="mt-1 text-xs text-muted/75">
                回退印记：{undo.note} · {formatDateTime(undo.savedAt)}
              </div>
            ) : (
              <div className="mt-1 text-xs text-muted/75">回退印记：暂无</div>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button
                type="button"
                variant="outline"
                onClick={restoreFromBackup}
                className="justify-start border-[hsl(var(--warn)/.35)] text-[hsl(var(--warn))] hover:bg-[hsl(var(--warn)/.08)]"
                disabled={!backup || backup.kind !== 'xuantian.annotations.hall.backup' || backup.v !== 1}
              >
                <BookOpen className="h-4 w-4" />
                回魂灯：从护卷符恢复
                <span className="ml-auto text-muted/70">↻</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={downloadBackup}
                className="justify-start"
                disabled={!backup || backup.kind !== 'xuantian.annotations.hall.backup' || backup.v !== 1}
              >
                <Download className="h-4 w-4" />
                下载护卷符快照
                <span className="ml-auto text-muted/70">↓</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={undoLastOperation}
                className="justify-start"
                disabled={!undo || undo.kind !== 'xuantian.annotations.hall.undo' || undo.v !== 1}
              >
                <RotateCcw className="h-4 w-4" />
                撤销上次变更
                <span className="ml-auto text-muted/70">↩</span>
              </Button>
              <Button type="button" variant="outline" onClick={cleanEmptyAnnotations} className="justify-start">
                <Trash2 className="h-4 w-4" />
                剔除空批注
                <span className="ml-auto text-muted/70">净</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => clearSourceAnnotations('grotto')}
                className="justify-start border-[hsl(var(--warn)/.35)] text-[hsl(var(--warn))] hover:bg-[hsl(var(--warn)/.08)]"
              >
                <MapIcon className="h-4 w-4" />
                清空洞府批注
                <span className="ml-auto text-muted/70">危</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => clearSourceAnnotations('relations')}
                className="justify-start border-[hsl(var(--warn)/.35)] text-[hsl(var(--warn))] hover:bg-[hsl(var(--warn)/.08)]"
              >
                <Waypoints className="h-4 w-4" />
                清空关系批注
                <span className="ml-auto text-muted/70">危</span>
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
              <motion.div
                ref={hallRef}
                layout={enableHallMotion ? 'position' : undefined}
                className="grid gap-3 lg:grid-cols-2"
              >
                <AnimatePresence initial={false} mode={enableHallMotion ? 'popLayout' : 'sync'}>
                  {filtered.map((it, idx) => {
                  const tone = toneToken(it.tone)
                  const label = it.source === 'grotto' ? '洞府图' : '关系谱'
                  const sub =
                    it.source === 'grotto'
                      ? `${timelineLayerLabel(it.layer)} · ${it.when}`
                      : `${it.kind} · ${it.meta}`

                  const entryKey = `${it.source}:${it.id}`

                  const relationJumpId =
                    it.source === 'grotto' ? relationNodeIdForTimelineId.get(it.id) ?? null : null
                  const grottoJumpId =
                    it.source === 'relations' && it.timelineId && timelineById.has(it.timelineId) ? it.timelineId : null

                  return (
                    <motion.div
                      key={entryKey}
                      data-hall-entry={entryKey}
                      layout={enableHallMotion ? 'position' : undefined}
                      style={enableHallMotion ? { willChange: 'transform, opacity' } : undefined}
                      className={cn(
                        'relative rounded-xl border border-border/60 bg-white/4 px-5 py-4',
                        '[content-visibility:auto] [contain-intrinsic-size:280px_220px]',
                        entryKey === activeEntryKey && (reduceMotion ? 'ring-1 ring-[hsl(var(--ring)/.25)]' : ''),
                      )}
                      initial={
                        reduceMotion || heavyList
                          ? false
                          : enableHallMotion
                            ? { opacity: 0, y: 10 }
                            : { opacity: 0 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        reduceMotion || heavyList
                          ? { opacity: 0 }
                          : enableHallMotion
                            ? { opacity: 0, y: -8 }
                            : { opacity: 0 }
                      }
                      transition={{
                        delay: reduceMotion || heavyList ? 0 : enableHallMotion ? idx * 0.015 : 0,
                        duration: reduceMotion || heavyList ? 0.12 : enableHallMotion ? 0.26 : 0.18,
                        ease: reduceMotion || heavyList ? undefined : [0.22, 1, 0.36, 1],
                      }}
                    >
                      {!reduceMotion && entryKey === activeEntryKey ? (
                        <motion.span
                          layoutId="hallActiveEntry"
                          className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[hsl(var(--ring)/.25)]"
                          transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                        />
                      ) : null}
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

                      <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3">
                        <Markdown
                          text={it.text}
                          className="prose-sm leading-7"
                          highlightQuery={appliedFindQuery}
                          highlightOptions={findOptions}
                          highlightScope="hall"
                          highlightIdPrefix="hall-hit-"
                          activeHighlightIndex={-1}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" variant="ghost" onClick={() => locateEntry(it)} className="justify-start">
                          <Compass className="h-4 w-4" />
                          {it.source === 'grotto' ? '回洞府图' : '回关系谱'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => appendEntryToNotes(it)}
                          className="justify-start"
                        >
                          <NotebookPen className="h-4 w-4" />
                          并入札记
                        </Button>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {it.chronicleSlug ? (
                          <Link
                            to={`/chronicles/${it.chronicleSlug}`}
                            onPointerEnter={() => prefetchIntent(`/chronicles/${it.chronicleSlug}`, 'hover')}
                            onPointerDown={() => prefetchIntent(`/chronicles/${it.chronicleSlug}`, 'press')}
                            onFocus={() => prefetchIntent(`/chronicles/${it.chronicleSlug}`, 'focus')}
                            className="focus-ring tap inline-flex items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-4 py-2 text-sm font-medium text-fg/90 hover:bg-white/10"
                          >
                            <BookOpen className="h-4 w-4" />
                            去读纪事
                          </Link>
                        ) : null}

                        {relationJumpId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onPointerEnter={() => prefetchIntent(`/relations?id=${relationJumpId}`, 'hover')}
                            onPointerDown={() => prefetchIntent(`/relations?id=${relationJumpId}`, 'press')}
                            onFocus={() => prefetchIntent(`/relations?id=${relationJumpId}`, 'focus')}
                            onClick={() => {
                              navigate(`/relations?id=${relationJumpId}`)
                              hapticTap()
                            }}
                            className="justify-start"
                          >
                            <Waypoints className="h-4 w-4" />
                            去关系谱
                          </Button>
                        ) : null}

                        {grottoJumpId ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onPointerEnter={() => prefetchIntent(`/grotto?id=${grottoJumpId}`, 'hover')}
                            onPointerDown={() => prefetchIntent(`/grotto?id=${grottoJumpId}`, 'press')}
                            onFocus={() => prefetchIntent(`/grotto?id=${grottoJumpId}`, 'focus')}
                            onClick={() => {
                              navigate(`/grotto?id=${grottoJumpId}`)
                              hapticTap()
                            }}
                            className="justify-start"
                          >
                            <MapIcon className="h-4 w-4" />
                            去洞府图
                          </Button>
                        ) : null}

                        <Button type="button" variant="outline" onClick={() => clearEntry(it)} className="justify-start">
                          <Trash2 className="h-4 w-4" />
                          清空
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
                <div className="text-sm font-semibold text-fg">暂无批注</div>
                <div className="mt-2 text-xs leading-6 text-muted/80">
                  若刚开始写，先去洞府图或关系谱落笔一两句；写下分寸，才算把路走稳。
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

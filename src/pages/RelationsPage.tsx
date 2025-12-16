import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  Copy,
  Map as MapIcon,
  NotebookPen,
  PencilLine,
  ScrollText,
  Search,
  Trash2,
  Waypoints,
  X,
} from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS, type MarkdownHighlightOptions, Markdown } from '../components/content/Markdown'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SectionHeading } from '../components/ui/SectionHeading'
import {
  RELATION_KINDS,
  getRelationEdgesFor,
  getRelatedNodeIds,
  relationEdges,
  relationNodes,
  type RelationKind,
  type RelationTone,
} from '../content/relations'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { findAllMatchRanges } from '../lib/find'
import { hapticSuccess, hapticTap } from '../lib/haptics'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }
type KindFilter = 'all' | RelationKind
type FindOptions = Required<MarkdownHighlightOptions>

type RelationAnnotation = {
  text: string
  updatedAt: number
}

type RelationAnnotations = Record<string, RelationAnnotation>

type RelationAnnotationsExportPayload = {
  kind: 'xuantian.relations.annotations'
  v: 1
  exportedAt: number
  count: number
  annotations: RelationAnnotations
}

function parseKind(raw: string | null): KindFilter | null {
  if (!raw) return null
  if (raw === 'all') return 'all'
  if ((RELATION_KINDS as readonly string[]).includes(raw)) return raw as RelationKind
  return null
}

function parseOnly(raw: string | null): boolean | null {
  if (!raw) return null
  if (raw === '1' || raw === 'true') return true
  if (raw === '0' || raw === 'false') return false
  return null
}

function toneToken(tone?: RelationTone) {
  if (tone === 'warn') return 'warn'
  if (tone === 'bright') return 'bright'
  return 'calm'
}

function nodeChrome(tone?: RelationTone, active?: boolean) {
  const t = toneToken(tone)
  const base =
    'focus-ring group absolute -translate-x-1/2 -translate-y-1/2 text-left ' +
    'transition-[background-color,border-color,box-shadow] duration-200 hover:shadow-lift'
  const box = 'w-[170px] max-w-[52vw] rounded-2xl border bg-[hsl(var(--fg)/.03)] px-3 py-2'
  const blur = ''
  if (t === 'warn') {
    return cn(
      base,
      box,
      blur,
      active
        ? 'border-[hsl(var(--warn)/.40)] bg-[hsl(var(--warn)/.10)] ring-1 ring-[hsl(var(--warn)/.16)]'
        : 'border-border/60 hover:border-[hsl(var(--warn)/.26)] hover:bg-[hsl(var(--fg)/.05)]',
    )
  }
  if (t === 'bright') {
    return cn(
      base,
      box,
      blur,
      active
        ? 'border-[hsl(var(--accent)/.36)] bg-[hsl(var(--accent)/.09)] ring-1 ring-[hsl(var(--accent)/.16)]'
        : 'border-border/60 hover:border-[hsl(var(--fg)/.14)] hover:bg-[hsl(var(--fg)/.05)]',
    )
  }
  return cn(
    base,
    box,
    blur,
    active
      ? 'border-[hsl(var(--fg)/.18)] bg-[hsl(var(--fg)/.06)] ring-1 ring-[hsl(var(--fg)/.10)]'
      : 'border-border/60 hover:border-[hsl(var(--fg)/.12)] hover:bg-[hsl(var(--fg)/.05)]',
  )
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const midX = (a.x + b.x) / 2
  const dy = Math.max(6, Math.min(22, Math.abs(b.y - a.y)))
  const c1 = { x: midX, y: a.y + Math.sign(b.y - a.y) * (dy * 0.35) }
  const c2 = { x: midX, y: b.y - Math.sign(b.y - a.y) * (dy * 0.35) }
  return `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`
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

export function RelationsPage() {
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const [graphEntered, setGraphEntered] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [storedSelected, setStoredSelected] = useLocalStorageState<string>(
    STORAGE_KEYS.relationsSelected,
    'xuan',
  )
  const [storedKind, setStoredKind] = useLocalStorageState<string>(STORAGE_KEYS.relationsKind, 'all')
  const [storedOnly, setStoredOnly] = useLocalStorageState<boolean>(STORAGE_KEYS.relationsOnly, false)
  const [annotations, setAnnotations] = useLocalStorageState<RelationAnnotations>(
    STORAGE_KEYS.relationsAnnotations,
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

  const nodeById = useMemo(() => new Map(relationNodes.map((n) => [n.id, n] as const)), [])
  const nodeSearchHayById = useMemo(() => {
    const map = new Map<string, string>()
    for (const n of relationNodes) {
      map.set(
        n.id,
        safeLower(
          [
            n.title,
            n.kind,
            n.summary,
            n.detail,
            ...(n.keywords ?? []),
            n.chronicleSlug ?? '',
            n.timelineId ?? '',
          ].join(' '),
        ),
      )
    }
    return map
  }, [])

  const canonicalAnnotations = useMemo<RelationAnnotations>(() => {
    const next: RelationAnnotations = {}
    for (const [id, a] of Object.entries(annotations)) {
      if (!nodeById.has(id)) continue
      if (!a || typeof a !== 'object') continue
      const text = typeof a.text === 'string' ? a.text.trim() : ''
      if (!text) continue
      const updatedAt = typeof a.updatedAt === 'number' ? a.updatedAt : 0
      next[id] = { text, updatedAt }
    }
    return next
  }, [annotations, nodeById])

  const annotationCount = useMemo(() => Object.keys(canonicalAnnotations).length, [canonicalAnnotations])

  const kind = useMemo<KindFilter>(() => {
    const fromUrl = parseKind(searchParams.get('kind'))
    if (fromUrl) return fromUrl
    const fromStore = parseKind(storedKind)
    return fromStore ?? 'all'
  }, [searchParams, storedKind])

  const onlyRelated = useMemo(() => {
    const fromUrl = parseOnly(searchParams.get('only'))
    if (fromUrl !== null) return fromUrl
    return storedOnly
  }, [searchParams, storedOnly])

  const filteredBase = useMemo(() => {
    const q = safeLower(appliedQuery.trim())
    return relationNodes.filter((n) => {
      if (kind !== 'all' && n.kind !== kind) return false
      if (!q) return true
      return (nodeSearchHayById.get(n.id) ?? '').includes(q)
    })
  }, [appliedQuery, kind, nodeSearchHayById])

  const selectedId = useMemo(() => {
    const fromUrl = searchParams.get('id')
    if (fromUrl && nodeById.has(fromUrl)) return fromUrl
    if (storedSelected && nodeById.has(storedSelected)) return storedSelected
    return filteredBase[0]?.id ?? 'xuan'
  }, [filteredBase, nodeById, searchParams, storedSelected])

  const selected = selectedId ? nodeById.get(selectedId) ?? null : null
  const selectedAnnotation = selectedId ? canonicalAnnotations[selectedId] ?? null : null
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

  const relatedIds = useMemo(() => {
    const set = new Set<string>()
    set.add('xuan')
    if (selectedId) {
      set.add(selectedId)
      for (const id of getRelatedNodeIds(selectedId)) set.add(id)
    }
    return set
  }, [selectedId])

  const visibleIds = useMemo(() => {
    if (onlyRelated) return relatedIds
    const set = new Set<string>()
    for (const n of filteredBase) set.add(n.id)
    for (const id of relatedIds) set.add(id)
    return set
  }, [filteredBase, onlyRelated, relatedIds])

  const visibleNodes = useMemo(() => {
    return relationNodes.filter((n) => visibleIds.has(n.id))
  }, [visibleIds])

  const visibleEdges = useMemo(() => {
    return relationEdges.filter((e) => visibleIds.has(e.from) && visibleIds.has(e.to))
  }, [visibleIds])

  const heavyGraph = !onlyRelated && (visibleEdges.length > 24 || visibleNodes.length > 18)

  const listNodes = useMemo(() => {
    if (!onlyRelated) return filteredBase
    const nodes = filteredBase.filter((n) => relatedIds.has(n.id))
    if (!selected) return nodes
    if (nodes.some((n) => n.id === selected.id)) return nodes
    return [selected, ...nodes]
  }, [filteredBase, onlyRelated, relatedIds, selected])

  useEffect(() => {
    setStoredSelected(selectedId)
  }, [selectedId, setStoredSelected])

  useEffect(() => {
    const t = window.setTimeout(() => setGraphEntered(true), 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    setStoredKind(kind)
  }, [kind, setStoredKind])

  useEffect(() => {
    setStoredOnly(onlyRelated)
  }, [onlyRelated, setStoredOnly])

  const flashMessage = useCallback((msg: string) => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    setFlash(msg)
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 950)
  }, [])

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

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false

    if ((next.get('id') ?? '') !== selectedId) {
      next.set('id', selectedId)
      changed = true
    }

    const canonicalKind = kind === 'all' ? '' : kind
    if ((next.get('kind') ?? '') !== canonicalKind) {
      if (!canonicalKind) next.delete('kind')
      else next.set('kind', canonicalKind)
      changed = true
    }

    const canonicalOnly = onlyRelated ? '1' : ''
    if ((next.get('only') ?? '') !== canonicalOnly) {
      if (!canonicalOnly) next.delete('only')
      else next.set('only', canonicalOnly)
      changed = true
    }

    if (!changed) return
    setSearchParams(next, { replace: true })
  }, [kind, onlyRelated, searchParams, selectedId, setSearchParams])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (onlyRelated) return
    const first = filteredBase[0]?.id
    if (!first) return
    if (filteredBase.some((n) => n.id === selectedId)) return
    const next = new URLSearchParams(searchParams)
    next.set('id', first)
    setSearchParams(next, { replace: true })
  }, [filteredBase, onlyRelated, searchParams, selectedId, setSearchParams])

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
  }, [annoDraft, annoDraftById, flashMessage, selectedAnnotation, selectedId, setAnnotations])

  useEffect(() => {
    if (!keyboardNavRef.current) return
    keyboardNavRef.current = false
    if (!selectedId) return
    const el = document.getElementById(`relation-list-${selectedId}`)
    if (!el) return
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
  }, [reduceMotion, selectedId])

  const selectId = useCallback(
    (id: string) => {
      if (!id) return
      if (!nodeById.has(id)) return
      const next = new URLSearchParams(searchParams)
      next.set('id', id)
      setSearchParams(next, { replace: true })
      hapticTap()
    },
    [nodeById, searchParams, setSearchParams],
  )

  const copyLocation = useCallback(async () => {
    if (!selectedId) {
      flashMessage('暂无可复制定位。')
      hapticTap()
      return
    }

    const params = new URLSearchParams()
    params.set('id', selectedId)
    if (kind !== 'all') params.set('kind', kind)
    if (onlyRelated) params.set('only', '1')
    const line = `定位：/relations?${params.toString()}`

    try {
      await navigator.clipboard.writeText(line)
      hapticSuccess()
      flashMessage('已复制定位。')
    } catch {
      flashMessage('复制失败：剪贴板不可用。')
      hapticTap()
    }
  }, [flashMessage, kind, onlyRelated, selectedId])

  const setKind = useCallback(
    (nextKind: KindFilter) => {
      const next = new URLSearchParams(searchParams)
      if (nextKind === 'all') next.delete('kind')
      else next.set('kind', nextKind)
      setSearchParams(next, { replace: true })
      hapticTap()
    },
    [searchParams, setSearchParams],
  )

  const setOnly = useCallback(
    (nextOnly: boolean) => {
      const next = new URLSearchParams(searchParams)
      if (!nextOnly) next.delete('only')
      else next.set('only', '1')
      setSearchParams(next, { replace: true })
      hapticTap()
    },
    [searchParams, setSearchParams],
  )

  const appendRelationAnnotationToNotes = useCallback(
    (nodeId: string, annText: string) => {
      const node = nodeById.get(nodeId)
      if (!node) return
      const ann = annText.trim()
      if (!ann) {
        window.alert('此处尚未落笔。')
        return
      }

      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

      const block = [
        `【${stamp} · 关系谱批注】`,
        `${node.kind} · ${node.title}`,
        node.summary,
        `“${ann}”`,
        `（来源：关系谱 · ${node.title}）`,
      ].join('\n')

      const prev = readString(STORAGE_KEYS.notes, '')
      const next = prev.trim() ? `${prev}\n\n${block}` : block
      writeString(STORAGE_KEYS.notes, next)

      const prevMeta = readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 })
      const nextMeta: NotesMeta = {
        ...prevMeta,
        updatedAt: now.getTime(),
        lastSource: `关系谱批注：${node.title}`,
      }
      writeJson(STORAGE_KEYS.notesMeta, nextMeta)

      hapticSuccess()
      flashMessage('批注已并入札记。')
    },
    [flashMessage, nodeById],
  )

  const appendSelectedToNotes = useCallback((includeAnnotation: boolean) => {
    if (!selected) return

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

    const edges = getRelationEdgesFor(selected.id)
    const related = edges
      .map((e) => {
        const otherId = e.from === selected.id ? e.to : e.from
        const other = nodeById.get(otherId)
        if (!other) return null
        return `${e.label}：${other.title}`
      })
      .filter(Boolean) as string[]

    const ann = includeAnnotation ? annoDraft.trim() : ''

    const block = [
      `【${stamp} · 关系谱摘记】`,
      `${selected.kind} · ${selected.title}`,
      selected.summary,
      selected.detail,
      includeAnnotation && ann ? '' : null,
      includeAnnotation && ann ? `【节点批注】` : null,
      includeAnnotation && ann ? `“${ann}”` : null,
      includeAnnotation && ann ? `（来源：关系谱 · ${selected.title}）` : null,
      related.length ? '' : null,
      related.length ? `牵连：` : null,
      ...related.map((x) => `- ${x}`),
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
      lastSource: includeAnnotation && ann ? `关系谱（含批注）：${selected.title}` : `关系谱：${selected.title}`,
    }
    writeJson(STORAGE_KEYS.notesMeta, nextMeta)

    hapticSuccess()
    flashMessage('已收入札记。')
  }, [annoDraft, flashMessage, nodeById, selected])

  const selectedEdges = useMemo(() => {
    if (!selected) return []
    return getRelationEdgesFor(selected.id)
  }, [selected])

  const spotlightId = hoveredId || selectedId

  const spotlightRelatedIdSet = useMemo(() => {
    if (!spotlightId) return new Set<string>()
    return new Set(getRelatedNodeIds(spotlightId))
  }, [spotlightId])

  const annotatedEntries = useMemo(() => {
    const q = safeLower(appliedAnnoQuery.trim())
    const items: { node: (typeof relationNodes)[number]; ann: RelationAnnotation }[] = []

    for (const node of relationNodes) {
      const ann = canonicalAnnotations[node.id]
      if (!ann) continue
      if (kind !== 'all' && node.kind !== kind) continue
      if (onlyRelated && !relatedIds.has(node.id)) continue

      if (q) {
        const base = nodeSearchHayById.get(node.id) ?? ''
        const annHay = safeLower(ann.text)
        if (!base.includes(q) && !annHay.includes(q)) continue
      }

      items.push({ node, ann })
    }

    items.sort((a, b) => (b.ann.updatedAt || 0) - (a.ann.updatedAt || 0))
    return items
  }, [appliedAnnoQuery, canonicalAnnotations, kind, nodeSearchHayById, onlyRelated, relatedIds])

  const exportRelationAnnotations = () => {
    if (annotationCount === 0) {
      window.alert('当前没有可导出的节点批注。')
      return
    }

    const payload: RelationAnnotationsExportPayload = {
      kind: 'xuantian.relations.annotations',
      v: 1,
      exportedAt: Date.now(),
      count: annotationCount,
      annotations: canonicalAnnotations,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-relations-annotations-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已导出批注存档。')
  }

  const exportRelationAnnotationsScroll = () => {
    if (annotationCount === 0) {
      window.alert('当前没有可导出的节点批注。')
      return
    }

    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const clock = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const kindRank = new Map<RelationKind, number>(RELATION_KINDS.map((k, i) => [k, i]))
    const nodes = relationNodes
      .filter((n) => Boolean(canonicalAnnotations[n.id]))
      .slice()
      .sort((a, b) => {
        const ak = kindRank.get(a.kind) ?? 999
        const bk = kindRank.get(b.kind) ?? 999
        if (ak !== bk) return ak - bk
        return a.title.localeCompare(b.title, 'zh-Hans-CN')
      })

    const lines: string[] = [
      '轩天帝 · 关系谱节点批注文卷',
      `导出时间：${stamp} ${clock}`,
      `共计：${annotationCount} 处`,
      '',
    ]

    for (const node of nodes) {
      const ann = canonicalAnnotations[node.id]
      if (!ann) continue

      lines.push(`【关系谱批注】${node.kind} · ${node.title}`)

      const parts = ann.text.split(/\r?\n/).map((x) => x.trimEnd())
      if (parts.length <= 1) {
        lines.push(`批注：${(parts[0] ?? '').trim()}`)
      } else {
        lines.push('批注：')
        for (const p of parts) lines.push(`  ${p}`)
      }

      const edges = getRelationEdgesFor(node.id)
      const related = edges
        .map((e) => {
          const otherId = e.from === node.id ? e.to : e.from
          const other = nodeById.get(otherId)
          if (!other) return null
          return `${e.label}：${other.title}`
        })
        .filter(Boolean) as string[]

      if (related.length) {
        lines.push('牵连：')
        for (const x of related) lines.push(`- ${x}`)
      }

      lines.push('')
    }

    const text = `${lines.join('\n').trimEnd()}\n`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-relations-annotations-${stamp}.txt`
    a.click()
    URL.revokeObjectURL(url)
    hapticTap()
    flashMessage('已导出批注文卷。')
  }

  const applyImportedAnnotations = (incoming: RelationAnnotations) => {
    const known: RelationAnnotations = {}
    for (const [id, a] of Object.entries(incoming)) {
      if (!nodeById.has(id)) continue
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

    const replace = window.confirm('导入方式：确定=覆盖现有批注；取消=合并（同一节点以导入为准）。')
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

  const importRelationAnnotations = async (file: File) => {
    try {
      const raw = await file.text()
      const data = JSON.parse(raw) as unknown

      let incoming: unknown = null
      if (data && typeof data === 'object') {
        const maybe = data as Partial<RelationAnnotationsExportPayload> & { annotations?: unknown }
        if (maybe.kind === 'xuantian.relations.annotations' && maybe.v === 1 && maybe.annotations) {
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
      const normalized: RelationAnnotations = {}
      for (const [id, v] of Object.entries(incomingMap)) {
        if (!v) continue
        if (typeof v === 'string') {
          const text = v.trim()
          if (!text) continue
          normalized[id] = { text, updatedAt: Date.now() }
          continue
        }
        if (typeof v === 'object') {
          const obj = v as Partial<RelationAnnotation>
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

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-7 md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.36),transparent_62%)] blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.30),transparent_62%)] blur-3xl" />

        <div className="relative">
          <Badge className="mb-4">关系谱</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">一张网，不为夸饰，只为对照</h2>
          <p className="mt-3 max-w-[88ch] text-sm leading-7 text-muted/85">
            这里把“人、誓词、旧物、关口与地点”连成一张谱：不是为了显得玄，而是为了把次序看清。
            你点一处，就能看见它牵连到哪几处；牵连越清楚，故事就越像真事。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/about">回人物志</ButtonLink>
            <ButtonLink to="/grotto" variant="ghost">
              去洞府图 <MapIcon className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/chronicles" variant="ghost">
              去读纪事 <BookOpen className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink to="/annotations" variant="ghost">
              批注馆 <ScrollText className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </Card>

        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <SectionHeading title="线索簿" subtitle="筛一筛，别让眼睛被“热闹”带跑。" />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                    const idx = listNodes.findIndex((n) => n.id === selectedId)
                    const base = idx >= 0 ? idx : -1
                    const next = listNodes[Math.min(listNodes.length - 1, base + 1)]
                    if (next) selectId(next.id)
                    return
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    keyboardNavRef.current = true
                    const idx = listNodes.findIndex((n) => n.id === selectedId)
                    const base = idx >= 0 ? idx : listNodes.length
                    const next = listNodes[Math.max(0, base - 1)]
                    if (next) selectId(next.id)
                    return
                  }
                  if (e.key === 'Enter') {
                    const el = annoTextareaRef.current
                    if (el) {
                      el.focus()
                      el.setSelectionRange(el.value.length, el.value.length)
                    }
                    return
                  }
                }}
                placeholder="搜：断桥 / 誓词 / 药单 / 青冥……（↑↓ 走位，Enter 落笔，Esc 清空）"
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
              {query.trim() && query.trim() !== appliedQuery.trim() ? '检索中…' : `命中 ${listNodes.length}`}
              {onlyRelated ? <span className="ml-1 text-muted/60">· 聚焦</span> : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="text-xs text-muted/70">类别</div>
            <Chip selected={kind === 'all'} onClick={() => setKind('all')}>
              全部
            </Chip>
            {RELATION_KINDS.map((k) => (
              <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>
                {k}
              </Chip>
            ))}
            <span className="mx-1 h-4 w-px bg-white/10" aria-hidden="true" />
            <Chip selected={onlyRelated} aria-pressed={onlyRelated} onClick={() => setOnly(!onlyRelated)}>
              只看牵连
            </Chip>
          </div>

          {onlyRelated ? (
            <div className="mt-2 text-xs leading-6 text-muted/75">
              聚焦已开启：谱面与线索簿只保留“当前节点”及其牵连，方便把线索走完。
            </div>
          ) : null}

          <div className="mt-5 grid gap-2">
            {listNodes.map((n) => {
              const active = n.id === selectedId
              return (
                <button
                  key={n.id}
                  type="button"
                  id={`relation-list-${n.id}`}
                  onClick={() => selectId(n.id)}
                  className={cn(
                    'focus-ring tap flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left',
                    '[content-visibility:auto] [contain-intrinsic-size:240px_96px]',
                    active
                      ? 'border-[hsl(var(--fg)/.20)] bg-[hsl(var(--fg)/.06)] ring-1 ring-[hsl(var(--fg)/.10)]'
                      : 'border-border/60 bg-white/4 hover:bg-white/7',
                  )}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-fg">{n.title}</div>
                    <div className="mt-1 text-xs text-muted/80">{n.kind} · {n.summary}</div>
                  </div>
                  <span className="mt-0.5 shrink-0 rounded-full border border-border/70 bg-white/5 px-2 py-0.5 text-[11px] text-muted/80">
                    {toneToken(n.tone) === 'warn' ? '警' : toneToken(n.tone) === 'bright' ? '明' : '平'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white/5 text-fg/90">
                <Waypoints className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg">读法建议</div>
                <div className="mt-1">先从“地点/旧物”入手，再看它牵连到哪些“关口/誓词”。越看越稳。</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:col-span-8 lg:grid-cols-12">
          <Card className="relative overflow-hidden lg:col-span-7">
            <SectionHeading title="谱面" subtitle="点节点；相连的线会亮起来。" />

            <div className="relative mt-4 h-[520px] rounded-xl border border-border/60 bg-white/3">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.18),transparent_62%)] blur-3xl" />
                <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.16),transparent_62%)] blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,.08),transparent_70%)] blur-3xl" />
              </div>

              <svg
                className="pointer-events-none absolute inset-0"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {visibleEdges.map((e) => {
                  const a = nodeById.get(e.from)?.pos
                  const b = nodeById.get(e.to)?.pos
                  if (!a || !b) return null

                  const connected = spotlightId ? e.from === spotlightId || e.to === spotlightId : false
                  const hasFocus = Boolean(spotlightId)

                  const transition = reduceMotion ? undefined : 'opacity 260ms ease, stroke 260ms ease, stroke-width 260ms ease'
                  const showGlow = !reduceMotion && hasFocus && connected

                  const baseOpacity = hasFocus ? (connected ? 0.88 : 0.06) : 0.26
                  const baseStroke = hasFocus && connected ? 'hsl(var(--accent) / 0.78)' : 'hsl(var(--fg) / 0.55)'
                  const baseStrokeWidth = hasFocus && connected ? 0.62 : 0.32

                  return (
                    <g key={e.id}>
                      {showGlow ? (
                        <path
                          d={edgePath(a, b)}
                          style={{
                            opacity: 0.18,
                            stroke: 'hsl(var(--accent2) / 0.72)',
                            strokeWidth: 1.15,
                            transition,
                            filter: 'drop-shadow(0 0 10px hsl(var(--accent2) / 0.22))',
                          }}
                          fill="none"
                          strokeLinecap="round"
                        />
                      ) : null}
                      <path
                        d={edgePath(a, b)}
                        style={{
                          opacity: baseOpacity,
                          stroke: baseStroke,
                          strokeWidth: baseStrokeWidth,
                          transition,
                          filter: showGlow ? 'drop-shadow(0 0 8px hsl(var(--accent) / 0.18))' : undefined,
                        }}
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>
                  )
                })}
              </svg>

              {visibleNodes.map((n, idx) => {
                const active = n.id === selectedId
                const spotlight = n.id === spotlightId
                const related =
                  spotlightId && !spotlight ? spotlightRelatedIdSet.has(n.id) || n.id === 'xuan' : true

                const dim = spotlightId ? !spotlight && !related : false

                if (reduceMotion || heavyGraph) {
                  const z = active || spotlight ? 60 : related ? 40 : 20
                  return (
                    <button
                      key={n.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectId(n.id)}
                      onPointerEnter={() => setHoveredId(n.id)}
                      onPointerLeave={() => setHoveredId(null)}
                      className={cn(
                        nodeChrome(n.tone, active),
                        'transition-opacity duration-200',
                        dim ? 'opacity-25' : 'opacity-100',
                      )}
                      style={{ left: `${n.pos.x}%`, top: `${n.pos.y}%`, zIndex: z }}
                    >
                      {!reduceMotion && active ? (
                        <motion.span
                          layoutId="relationNodeActive"
                          className="pointer-events-none absolute inset-0 rounded-2xl border border-[hsl(var(--accent)/.32)] bg-[radial-gradient(circle_at_25%_15%,hsl(var(--accent)/.14),transparent_66%)] ring-1 ring-[hsl(var(--accent)/.18)]"
                          transition={{ type: 'spring', stiffness: 560, damping: 38 }}
                        />
                      ) : null}
                      <div className="relative z-10">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              toneToken(n.tone) === 'warn'
                                ? 'bg-[hsl(var(--warn)/.95)]'
                                : toneToken(n.tone) === 'bright'
                                  ? 'bg-[hsl(var(--accent2)/.95)]'
                                  : 'bg-[hsl(var(--fg)/.55)]',
                            )}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-xs font-semibold text-fg">{n.title}</div>
                              {active ? (
                                <span className="shrink-0 rounded-full border border-[hsl(var(--accent)/.30)] bg-[hsl(var(--accent)/.10)] px-2 py-0.5 text-[10px] text-fg/90">
                                  当前
                                </span>
                              ) : related && spotlightId ? (
                                <span className="shrink-0 rounded-full border border-border/70 bg-[hsl(var(--fg)/.04)] px-2 py-0.5 text-[10px] text-muted/80">
                                  牵连
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 text-[10px] leading-5 text-muted/70">{n.kind}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                }

                return (
                  <motion.button
                    key={n.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectId(n.id)}
                    onPointerEnter={() => setHoveredId(n.id)}
                    onPointerLeave={() => setHoveredId(null)}
                    className={cn(nodeChrome(n.tone, active))}
                    style={{ left: `${n.pos.x}%`, top: `${n.pos.y}%`, zIndex: active || spotlight ? 60 : related ? 40 : 20 }}
                    initial={{ opacity: 0, scale: 0.98, y: 6 }}
                    animate={{ opacity: dim ? 0.25 : 1, scale: 1, y: 0 }}
                    transition={{
                      delay: graphEntered ? 0 : idx * 0.015,
                      type: 'spring',
                      stiffness: 520,
                      damping: 36,
                      mass: 0.7,
                    }}
                  >
                    {!reduceMotion && active ? (
                      <motion.span
                        layoutId="relationNodeActive"
                        className="pointer-events-none absolute inset-0 rounded-2xl border border-[hsl(var(--accent)/.32)] bg-[radial-gradient(circle_at_25%_15%,hsl(var(--accent)/.14),transparent_66%)] ring-1 ring-[hsl(var(--accent)/.18)]"
                        transition={{ type: 'spring', stiffness: 560, damping: 38 }}
                      />
                    ) : null}
                    <div className="relative z-10">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            toneToken(n.tone) === 'warn'
                              ? 'bg-[hsl(var(--warn)/.95)]'
                              : toneToken(n.tone) === 'bright'
                                ? 'bg-[hsl(var(--accent2)/.95)]'
                                : 'bg-[hsl(var(--fg)/.55)]',
                          )}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-xs font-semibold text-fg">{n.title}</div>
                            {active ? (
                              <span className="shrink-0 rounded-full border border-[hsl(var(--accent)/.30)] bg-[hsl(var(--accent)/.10)] px-2 py-0.5 text-[10px] text-fg/90">
                                当前
                              </span>
                            ) : related && spotlightId ? (
                              <span className="shrink-0 rounded-full border border-border/70 bg-[hsl(var(--fg)/.04)] px-2 py-0.5 text-[10px] text-muted/80">
                                牵连
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-[10px] leading-5 text-muted/70">{n.kind}</div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </Card>

          <Card className="relative overflow-hidden lg:col-span-5">
            <SectionHeading title="详记" subtitle="不做“神话”，只做“对照”。" />

            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div
                  key={selected.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
                >
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge>{selected.kind}</Badge>
                    <span className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-[11px] text-muted/80">
                      {toneToken(selected.tone) === 'warn' ? '警' : toneToken(selected.tone) === 'bright' ? '明' : '平'}
                    </span>
                  </div>

                  <div className="mt-4 text-lg font-semibold tracking-tight text-fg">{selected.title}</div>
                  <div className="mt-2 text-sm leading-7 text-muted/85">{selected.detail}</div>

                  <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white/5 text-fg/90">
                            <PencilLine className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-fg">节点批注</div>
                            <div className="text-xs text-muted/70">写一句你自己的对照（自动保存）。</div>
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
                      placeholder="例如：这条牵连不是靠声势，而是靠能被对照的细则。"
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
                          placeholder="搜批注：誓词 / 旧物 / 端秤……（Enter 跳首处，Esc 清空）"
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
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => appendRelationAnnotationToNotes(selected.id, annoDraft)}
                        className="justify-start"
                        disabled={!annoDraft.trim()}
                      >
                        <NotebookPen className="h-4 w-4" />
                        并入札记
                        <span className="ml-auto text-muted/70">＋</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (!selected.id) return
                          const has = Boolean(annoDraft.trim() || canonicalAnnotations[selected.id])
                          if (!has) return
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
                        disabled={!annoDraft.trim() && !canonicalAnnotations[selected.id]}
                      >
                        <Trash2 className="h-4 w-4" />
                        清空
                      </Button>
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

                    {selected.timelineId ? (
                      <Link
                        to={`/grotto?id=${selected.timelineId}`}
                        className="focus-ring tap inline-flex w-full items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-4 py-3 text-sm font-medium text-fg/90 hover:bg-white/10"
                      >
                        <MapIcon className="h-4 w-4" />
                        在洞府图定位
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
                      onClick={() => appendSelectedToNotes(false)}
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
                        onClick={() => appendSelectedToNotes(true)}
                        className="justify-start"
                      >
                        <NotebookPen className="h-4 w-4" />
                        收入札记（含批注）
                        <span className="ml-auto text-muted/70">＋</span>
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
                    <div className="text-sm font-semibold text-fg">牵连</div>
                    {selectedEdges.length ? (
                      <div className="mt-3 grid gap-2">
                        {selectedEdges.map((e) => {
                          const otherId = e.from === selected.id ? e.to : e.from
                          const other = nodeById.get(otherId)
                          if (!other) return null
                          return (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => selectId(other.id)}
                              className="focus-ring tap flex w-full items-start justify-between gap-3 rounded-xl border border-border/70 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                            >
                              <div className="min-w-0">
                                <div className="text-xs text-muted/70">{e.label}</div>
                                <div className="mt-0.5 truncate text-sm font-medium text-fg/90">{other.title}</div>
                                <div className="mt-1 text-xs text-muted/80">{other.kind} · {other.summary}</div>
                              </div>
                              <span className="mt-0.5 shrink-0 text-xs text-muted/70">→</span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 text-xs leading-6 text-muted/80">此处线索暂未连到别处。</div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
                    小提示：点“牵连”里的条目，谱面会把相关节点提亮；再回去读纪事，会更像把路走了一遍。
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
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-4 rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center"
                >
                  <div className="text-sm font-semibold text-fg">暂无线索</div>
                  <div className="mt-2 text-xs leading-6 text-muted/80">筛选过严时，这里会保持安静。</div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>

      <Card className="relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.22),transparent_62%)] blur-3xl" />
        <div className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.18),transparent_62%)] blur-3xl" />

        <SectionHeading title="批注总览" subtitle="把你写下的对照摊开：哪条线最稳，哪条线最虚，一眼便知。" />

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
              placeholder="搜批注：誓词 / 旧物 / 端秤 / 界石……（Esc 清空）"
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

        <input
          ref={annoImportRef}
          type="file"
          accept="application/json,text/plain"
          className="hidden"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (!file) return
            void importRelationAnnotations(file)
          }}
        />

        <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-fg">批注存档</div>
            <div className="text-xs text-muted/70">已写 {annotationCount} 处</div>
          </div>
          <div className="mt-2 text-xs leading-6 text-muted/80">
            建议偶尔导出一次存档，防止设备更换或清理缓存后丢失；文卷适合阅读与归档。
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="ghost"
              className="justify-start"
              onClick={exportRelationAnnotationsScroll}
              disabled={annotationCount === 0}
            >
              导出文卷
              <span className="ml-auto text-muted/70">↓</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-start"
              onClick={exportRelationAnnotations}
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

        {annotationCount === 0 ? (
          <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
            <div className="text-sm font-semibold text-fg">还没写下批注</div>
            <div className="mt-2 text-xs leading-6 text-muted/80">
              先在右侧“节点批注”落笔一两句；再回来看，牵连会更像真事。
            </div>
          </div>
        ) : annotatedEntries.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {annotatedEntries.map(({ node, ann }) => (
              <div
                key={node.id}
                className={cn(
                  'rounded-xl border border-border/60 bg-white/4 px-5 py-4',
                  '[content-visibility:auto] [contain-intrinsic-size:420px_260px]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{node.kind}</Badge>
                      <span className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-[11px] text-muted/80">
                        {toneToken(node.tone) === 'warn'
                          ? '警'
                          : toneToken(node.tone) === 'bright'
                            ? '明'
                            : '平'}
                      </span>
                      <span className="text-xs text-muted/70">最近：{formatClock(ann.updatedAt)}</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-fg">{node.title}</div>
                    <div className="mt-1 text-xs leading-6 text-muted/80">{node.summary}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3">
                  <Markdown text={ann.text} className="prose-sm leading-7" />
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => selectId(node.id)}
                    className="justify-start"
                  >
                    <MapIcon className="h-4 w-4" />
                    定位到节点
                    <span className="ml-auto text-muted/70">→</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => appendRelationAnnotationToNotes(node.id, ann.text)}
                    className="justify-start"
                  >
                    <NotebookPen className="h-4 w-4" />
                    并入札记
                    <span className="ml-auto text-muted/70">＋</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
            <div className="text-sm font-semibold text-fg">暂无匹配</div>
            <div className="mt-2 text-xs leading-6 text-muted/80">换个词试试，或清空检索。</div>
          </div>
        )}

        <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
          小提示：这里沿用“类别/只看牵连”的筛选。你可以先聚焦，再把批注逐条并入札记——久了就成心法。
        </div>
      </Card>
    </div>
  )
}

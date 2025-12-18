import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Download, Filter, GripVertical, Search, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SectionHeading } from '../components/ui/SectionHeading'
import { chronicleIndex, getAllTags } from '../content/chronicleIndex'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { readString, writeString } from '../lib/storage'
import { prefetchIntent } from '../routes/prefetch'

export function ChroniclesPage() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion() ?? false
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const importFileRef = useRef<HTMLInputElement | null>(null)
  const tags = useMemo(() => ['全部', ...getAllTags()], [])
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [bookmarks, setBookmarks] = useLocalStorageState<string[]>(STORAGE_KEYS.bookmarks, [])

  const onlyBookmarks = useMemo(() => searchParams.get('only') === 'bookmarks', [searchParams])

  const selectedTag = useMemo(() => {
    const fromUrl = searchParams.get('tag')
    if (fromUrl) return fromUrl
    const saved = readString(STORAGE_KEYS.tagFilter, '')
    return saved || '全部'
  }, [searchParams])

  useEffect(() => {
    if (selectedTag && selectedTag !== '全部') writeString(STORAGE_KEYS.tagFilter, selectedTag)
  }, [selectedTag])

  const chronicleMap = useMemo(() => {
    return new Map(chronicleIndex.map((c) => [c.slug, c] as const))
  }, [])

  const bookmarkedChronicles = useMemo(() => {
    return bookmarks
      .map((s) => chronicleMap.get(s))
      .filter((c): c is (typeof chronicleIndex)[number] => Boolean(c))
  }, [bookmarks, chronicleMap])

  const filtered = useMemo(() => {
    const q = query.trim()
    const source = onlyBookmarks ? bookmarkedChronicles : chronicleIndex

    return source.filter((c) => {
      const tagOk = selectedTag === '全部' ? true : c.tags.includes(selectedTag)
      if (!tagOk) return false
      if (!q) return true
      const hay = `${c.title} ${c.excerpt} ${c.tags.join(' ')} ${c.dateText}`
      return hay.includes(q)
    })
  }, [bookmarkedChronicles, onlyBookmarks, query, selectedTag])

  const visibleBookmarkIds = useMemo(() => {
    if (!onlyBookmarks) return []
    return filtered.map((c) => c.slug)
  }, [filtered, onlyBookmarks])

  const heavyList = filtered.length > 64

  const exportBookmarks = () => {
    const canonical = bookmarks.filter((s) => chronicleMap.has(s))
    const payload = {
      kind: 'xuantian.bookmarks',
      v: 1,
      exportedAt: Date.now(),
      count: canonical.length,
      bookmarks: canonical,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-bookmarks-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyImportedBookmarks = (nextBookmarks: string[]) => {
    const known = nextBookmarks.filter((s) => chronicleMap.has(s))
    const unique: string[] = []
    const seen = new Set<string>()
    for (const s of known) {
      if (seen.has(s)) continue
      seen.add(s)
      unique.push(s)
    }

    if (unique.length === 0) {
      window.alert('导入失败：文件里没有可识别的收藏条目。')
      return
    }

    const replace = window.confirm('导入方式：确定=覆盖现有收藏；取消=合并到现有收藏末尾。')
    if (replace) {
      setBookmarks(unique)
      window.alert(`已覆盖收藏：${unique.length} 篇。`)
      return
    }

    setBookmarks((prev) => {
      const merged = [...prev]
      const set = new Set(prev)
      for (const s of unique) {
        if (set.has(s)) continue
        set.add(s)
        merged.push(s)
      }
      return merged
    })
    window.alert(`已合并导入：${unique.length} 篇（重复项自动忽略）。`)
  }

  const importBookmarks = async (file: File) => {
    try {
      const raw = await file.text()
      const data = JSON.parse(raw) as unknown
      const list =
        Array.isArray(data) ? data :
        data && typeof data === 'object' && Array.isArray((data as { bookmarks?: unknown }).bookmarks)
          ? (data as { bookmarks: unknown }).bookmarks
          : null

      if (!list) {
        window.alert('导入失败：文件格式不支持。请导入本站导出的收藏文件。')
        return
      }

      const nextBookmarks = (list as unknown[]).filter((x): x is string => typeof x === 'string')
      applyImportedBookmarks(nextBookmarks)
    } catch {
      window.alert('导入失败：无法读取文件内容。')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-7 md:p-10">
        <Badge className="mb-4">纪事</Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">按章入卷</h2>
        <p className="mt-3 max-w-[80ch] text-sm leading-7 text-muted/85">
          这些篇章不写“惊天口号”，只写可落地的行止：守诺、留分寸、救荒、立规。读完若有所得，去“札记”记一笔。
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <SectionHeading title="筛选" subtitle="标签会记住；也可用搜索补一刀。 " />

          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white/4 px-4 py-3">
            <Search className="h-4 w-4 text-muted/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜标题 / 关键词 / 月份…"
              className="focus-ring w-full bg-transparent text-sm text-fg placeholder:text-muted/70"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-muted/70">
            <Filter className="h-4 w-4" />
            <span>范围</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Chip
              selected={!onlyBookmarks}
              className="relative overflow-hidden"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.delete('only')
                setSearchParams(next, { replace: true })
              }}
            >
              {!reduceMotion && !onlyBookmarks ? (
                <motion.span
                  layoutId="chroniclesRangeActive"
                  className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              ) : null}
              <span className="relative z-10">全部</span>
            </Chip>
            <Chip
              selected={onlyBookmarks}
              className="relative overflow-hidden"
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('only', 'bookmarks')
                setSearchParams(next, { replace: true })
              }}
            >
              {!reduceMotion && onlyBookmarks ? (
                <motion.span
                  layoutId="chroniclesRangeActive"
                  className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                  transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                />
              ) : null}
              <span className="relative z-10">收藏（{bookmarks.length}）</span>
            </Chip>
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-muted/70">
            <Filter className="h-4 w-4" />
            <span>标签</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <Chip
                key={t}
                selected={selectedTag === t}
                className="relative overflow-hidden"
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  if (t === '全部') next.delete('tag')
                  else next.set('tag', t)
                  setSearchParams(next, { replace: true })
                  if (t !== '全部') writeString(STORAGE_KEYS.tagFilter, t)
                }}
              >
                {!reduceMotion && selectedTag === t ? (
                  <motion.span
                    layoutId="chroniclesTagActive"
                    className="pointer-events-none absolute inset-0 rounded-full border border-white/18 bg-white/8"
                    transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                  />
                ) : null}
                <span className="relative z-10">{t}</span>
              </Chip>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
            小提示：按 <span className="text-fg/90">Ctrl/⌘ + K</span> 可唤起灵镜，直接跳到某一篇。
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <SectionHeading
            title={`共 ${filtered.length} 篇`}
            subtitle={
              onlyBookmarks
                ? '仅显示你收藏的篇章（本地保存）。'
                : selectedTag === '全部'
                  ? '按时间顺序陈列。'
                  : `当前标签：${selectedTag}`
            }
          />

          {bookmarks.length > 0 && !onlyBookmarks ? (
            <div className="mb-4 rounded-xl border border-border/60 bg-white/4 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-fg">我的收藏</div>
                <ButtonLink to="/chronicles?only=bookmarks" variant="ghost" className="px-3 py-1.5">
                  只看收藏 <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {bookmarkedChronicles.slice(0, 4).map((c) =>
                  c ? (
                    <Link
                      key={c.slug}
                      to={`/chronicles/${c.slug}`}
                      onPointerEnter={() => prefetchIntent(`/chronicles/${c.slug}`)}
                      onPointerDown={() => prefetchIntent(`/chronicles/${c.slug}`)}
                      onFocus={() => prefetchIntent(`/chronicles/${c.slug}`)}
                      className={cn(
                        'focus-ring tap rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-left',
                        'hover:bg-white/7',
                      )}
                    >
                      <div className="text-sm font-semibold text-fg line-clamp-2">{c.title}</div>
                      <div className="mt-1 text-xs text-muted/70">{c.dateText}</div>
                    </Link>
                  ) : null,
                )}
              </div>
              {bookmarkedChronicles.length > 4 ? (
                <div className="mt-3 text-xs text-muted/70">
                  还有 {bookmarkedChronicles.length - 4} 篇收藏未展开显示。
                </div>
              ) : null}
            </div>
          ) : null}

          {onlyBookmarks ? (
            bookmarks.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center">
                <div className="text-sm font-semibold text-fg">暂无收藏</div>
                <div className="mt-2 text-xs leading-6 text-muted/80">
                  在任意篇章点“收藏”，这里就会出现你的标记；并支持拖拽排序与一键取消。
                </div>
                <div className="mt-5 flex justify-center">
                  <ButtonLink to="/chronicles" variant="ghost" className="px-4 py-2">
                    去看全部纪事 <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={importFileRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0]
                    e.currentTarget.value = ''
                    if (!file) return
                    void importBookmarks(file)
                  }}
                />

                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  <Button type="button" variant="ghost" onClick={exportBookmarks} className="justify-start">
                    <Download className="h-4 w-4" />
                    导出收藏
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => importFileRef.current?.click()}
                    className="justify-start"
                  >
                    <Upload className="h-4 w-4" />
                    导入收藏
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const ok = window.confirm('确认清空所有收藏？此操作会清除本地保存的收藏列表。')
                      if (!ok) return
                      setBookmarks([])
                    }}
                    className="justify-start"
                  >
                    <Trash2 className="h-4 w-4" />
                    清空
                  </Button>
                </div>

                <div className="mb-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-xs leading-6 text-muted/80">
                  提示：拖拽左侧把手可调整收藏顺序；点右侧 <span className="text-fg/90">×</span>{' '}
                  可取消收藏。排序与收藏都保存在本地。
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    const { active, over } = event
                    if (!over) return
                    if (active.id === over.id) return
                    const activeId = String(active.id)
                    const overId = String(over.id)
                    const oldIndex = visibleBookmarkIds.indexOf(activeId)
                    const newIndex = visibleBookmarkIds.indexOf(overId)
                    if (oldIndex < 0 || newIndex < 0) return

                    const moved = arrayMove(visibleBookmarkIds, oldIndex, newIndex)
                    const set = new Set(visibleBookmarkIds)

                    setBookmarks((prev) => {
                      const queue = [...moved]
                      return prev.map((id) => (set.has(id) ? (queue.shift() ?? id) : id))
                    })
                  }}
                >
                  <SortableContext items={visibleBookmarkIds} strategy={verticalListSortingStrategy}>
                    <div className="grid gap-2">
                      {filtered.map((c) => (
                        <SortableBookmarkRow
                          key={c.slug}
                          slug={c.slug}
                          title={c.title}
                          dateText={c.dateText}
                          tags={c.tags}
                          onOpen={() => navigate(`/chronicles/${c.slug}`)}
                          onRemove={() => setBookmarks((prev) => prev.filter((s) => s !== c.slug))}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </>
            )
          ) : (
            <motion.div layout="position" className="grid gap-2">
              <AnimatePresence initial={false} mode={reduceMotion || heavyList ? 'sync' : 'popLayout'}>
                {filtered.map((c, idx) => (
                  <motion.div
                    key={c.slug}
                    layout="position"
                    style={reduceMotion || heavyList ? undefined : { willChange: 'transform, opacity' }}
                    initial={reduceMotion || heavyList ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion || heavyList ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={
                      reduceMotion || heavyList
                        ? { duration: 0.12 }
                        : { delay: idx * 0.02, duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    <Link
                      to={`/chronicles/${c.slug}`}
                      onPointerEnter={() => prefetchIntent(`/chronicles/${c.slug}`)}
                      onPointerDown={() => prefetchIntent(`/chronicles/${c.slug}`)}
                      onFocus={() => prefetchIntent(`/chronicles/${c.slug}`)}
                      className={cn(
                        'focus-ring tap group rounded-xl border border-border/60 bg-white/4 px-5 py-5',
                        'hover:bg-white/7',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-fg">{c.title}</div>
                          <div className="mt-1 text-xs text-muted/70">{c.dateText}</div>
                          <div className="mt-3 text-sm leading-7 text-muted/85">{c.excerpt}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {c.tags.map((t) => (
                              <span
                                key={t}
                                className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-xs text-muted/80"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted/70 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted/70">
              读完一篇，去“札记”写一句自己的分寸。
            </div>
            <ButtonLink to="/notes" variant="ghost" className="px-3 py-1.5">
              打开札记 <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Card>
      </div>
    </div>
  )
}

function SortableBookmarkRow({
  slug,
  title,
  dateText,
  tags,
  onOpen,
  onRemove,
}: {
  slug: string
  title: string
  dateText: string
  tags: string[]
  onOpen: () => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slug,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-70')}>
      <div
        className={cn(
          'focus-ring tap flex w-full items-start gap-3 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-left',
          'hover:bg-white/7',
        )}
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen()
          }
        }}
      >
        <button
          type="button"
          className={cn(
            'focus-ring tap mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-muted/80',
            'hover:bg-white/10 hover:text-fg/90',
          )}
          aria-label="拖拽排序"
          {...attributes}
          {...listeners}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-fg line-clamp-2">{title}</div>
              <div className="mt-1 text-xs text-muted/70">{dateText}</div>
            </div>
            <button
              type="button"
              className={cn(
                'focus-ring tap inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-white/5 text-muted/70',
                'hover:bg-white/10 hover:text-fg/90',
              )}
              aria-label="取消收藏"
              title="取消收藏"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onRemove()
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border/70 bg-white/5 px-2 py-1 text-xs text-muted/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

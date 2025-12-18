import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BookOpen, BookmarkCheck, Gem, Home, Map, NotebookPen, ScrollText, Search, User, Waypoints } from 'lucide-react'
import React, { createContext, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { chronicleIndex } from '../../content/chronicleIndex'
import { cn } from '../../lib/cn'
import { prefetchIntent } from '../../routes/prefetch'

type CommandItem = {
  id: string
  title: string
  subtitle?: string
  keywords: string[]
  search: {
    title: string
    subtitle: string
    keywords: string[]
  }
  icon?: React.ReactNode
  prefetchTo?: string
  run: () => void
}

type CommandPaletteContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.isContentEditable) return true
  const tag = el.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const value = useMemo<CommandPaletteContextValue>(() => {
    return {
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((v) => !v),
    }
  }, [isOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      const isCmdK = (e.ctrlKey || e.metaKey) && k === 'k'
      if (isCmdK) {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      if (k === 'escape') {
        setIsOpen(false)
        return
      }

      if (k === '/' && !isTypingTarget(e.target)) {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen ? <CommandPaletteModal onClose={() => setIsOpen(false)} /> : null}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette 必须在 CommandPaletteProvider 内使用')
  return ctx
}

function CommandPaletteModal({
  onClose,
}: {
  onClose: () => void
}) {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion() ?? false
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo<CommandItem[]>(() => {
    const withSearch = (it: Omit<CommandItem, 'search'>): CommandItem => {
      return {
        ...it,
        search: {
          title: it.title.toLowerCase(),
          subtitle: (it.subtitle ?? '').toLowerCase(),
          keywords: it.keywords.map((k) => k.toLowerCase()),
        },
      }
    }

    const routes: Omit<CommandItem, 'search'>[] = [
      {
        id: 'route-home',
        title: '洞天首页',
        subtitle: '回到卷首',
        keywords: ['首页', '洞天', '卷首'],
        icon: <Home className="h-4 w-4" />,
        prefetchTo: '/',
        run: () => navigate('/'),
      },
      {
        id: 'route-chronicles',
        title: '纪事',
        subtitle: '按章入卷',
        keywords: ['纪事', '卷', '章', '故事', '纪要'],
        icon: <BookOpen className="h-4 w-4" />,
        prefetchTo: '/chronicles',
        run: () => navigate('/chronicles'),
      },
      {
        id: 'route-bookmarks',
        title: '收藏的纪事',
        subtitle: '只看你标记过的篇章',
        keywords: ['收藏', '书签', '标记', '纪事', '篇章'],
        icon: <BookmarkCheck className="h-4 w-4" />,
        prefetchTo: '/chronicles?only=bookmarks',
        run: () => navigate('/chronicles?only=bookmarks'),
      },
      {
        id: 'route-grotto',
        title: '洞府图',
        subtitle: '把年表写成路',
        keywords: ['洞府', '地图', '年表', '路标', '灵脉', '关口'],
        icon: <Map className="h-4 w-4" />,
        prefetchTo: '/grotto',
        run: () => navigate('/grotto'),
      },
      {
        id: 'route-about',
        title: '人物志',
        subtitle: '轩少其人',
        keywords: ['人物', '人物志', '轩少', '轩天帝', '其人'],
        icon: <User className="h-4 w-4" />,
        prefetchTo: '/about',
        run: () => navigate('/about'),
      },
      {
        id: 'route-relations',
        title: '关系谱',
        subtitle: '把人、誓词、旧物与关口连成网',
        keywords: ['关系', '关系谱', '牵连', '誓词', '旧物', '关口', '对照'],
        icon: <Waypoints className="h-4 w-4" />,
        prefetchTo: '/relations',
        run: () => navigate('/relations'),
      },
      {
        id: 'route-annotations',
        title: '批注馆',
        subtitle: '把路标与牵连的批注汇在一起',
        keywords: ['批注', '批注馆', '对照', '分寸', '复盘', '归拢', '札记'],
        icon: <ScrollText className="h-4 w-4" />,
        prefetchTo: '/annotations',
        run: () => navigate('/annotations'),
      },
      {
        id: 'route-treasury',
        title: '藏品',
        subtitle: '法宝与旧物（可拖拽排序）',
        keywords: ['藏品', '法宝', '旧物', '排序', '拖拽'],
        icon: <Gem className="h-4 w-4" />,
        prefetchTo: '/treasury',
        run: () => navigate('/treasury'),
      },
      {
        id: 'route-notes',
        title: '札记',
        subtitle: '写下当日心法（自动保存）',
        keywords: ['札记', '笔记', '心法', '记录', '保存'],
        icon: <NotebookPen className="h-4 w-4" />,
        prefetchTo: '/notes',
        run: () => navigate('/notes'),
      },
    ]

    const chapters: Omit<CommandItem, 'search'>[] = chronicleIndex.map((c) => ({
      id: `chronicle-${c.slug}`,
      title: c.title,
      subtitle: c.dateText,
      keywords: [c.title, c.excerpt, c.dateText, ...c.tags],
      icon: <BookOpen className="h-4 w-4" />,
      prefetchTo: `/chronicles/${c.slug}`,
      run: () => navigate(`/chronicles/${c.slug}`),
    }))

    return [...routes, ...chapters].map(withSearch)
  }, [navigate])

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return items

    return items
      .map((it) => {
        let score = 0
        if (it.search.title.includes(q)) score = Math.max(score, 3)
        if (it.search.subtitle.includes(q)) score = Math.max(score, 2)
        if (it.search.keywords.some((k) => k.includes(q))) score = Math.max(score, 1)
        return { it, score, title: it.search.title }
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => {
        const byScore = b.score - a.score
        if (byScore) return byScore
        return a.title.localeCompare(b.title, 'zh-Hans-CN')
      })
      .map((x) => x.it)
  }, [deferredQuery, items])

  const enableActiveMotion = !reduceMotion && filtered.length <= 48
  const enableListMotion = !reduceMotion && filtered.length <= 42

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => setActiveIndex(0), 0)
    return () => window.clearTimeout(t)
  }, [deferredQuery])

  useEffect(() => {
    const it = filtered[activeIndex]
    if (it?.prefetchTo) prefetchIntent(it.prefetchTo)
  }, [activeIndex, filtered])

  useEffect(() => {
    const el = listRef.current
    const active = el?.querySelector(`[data-cmd-index="${activeIndex}"]`) as HTMLElement | null
    active?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const runActive = () => {
    const it = filtered[activeIndex]
    if (!it) return
    it.run()
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      runActive()
    }
  }

  const node =
    (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center px-4 pb-10 pt-24"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0 }}
        >
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <motion.div
            className={cn(
              'glass relative w-full max-w-[820px] overflow-hidden rounded-xl2',
              'shadow-lift',
            )}
            initial={reduceMotion ? false : { y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 12, scale: 0.98, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.7,
            }}
            role="dialog"
            aria-modal="true"
            aria-label="灵镜检索"
          >
            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-fg/90">
                <Search className="h-4 w-4" />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={onKeyDown}
                placeholder="搜一章、搜一事、搜一处去处……（Ctrl/⌘ + K 或 /）"
                className={cn(
                  'focus-ring w-full bg-transparent text-[15px] text-fg placeholder:text-muted/70',
                )}
              />
              <div className="hidden shrink-0 items-center gap-2 text-xs text-muted/80 sm:flex">
                <span className="rounded-lg border border-border/70 bg-white/5 px-2 py-1">Esc</span>
                <span>收镜</span>
              </div>
            </div>

            <div
              ref={listRef}
              className="max-h-[56vh] overflow-auto p-2 [scrollbar-width:thin]"
            >
              {filtered.length === 0 ? (
                <div className="px-4 py-10 text-sm text-muted/80">
                  没搜到相符条目。换个词试试：例如“问剑 / 霜月 / 洞府 / 札记”。
                </div>
              ) : (
                <motion.div layout={enableListMotion ? 'position' : undefined} className="grid gap-1">
                  <AnimatePresence initial={false} mode={enableListMotion ? 'popLayout' : 'sync'}>
                    {filtered.map((it, idx) => (
                    <motion.button
                      key={it.id}
                      data-cmd-index={idx}
                      type="button"
                      className={cn(
                        'tap focus-ring relative w-full rounded-xl px-3 py-3 text-left',
                        idx === activeIndex ? 'text-fg' : 'bg-transparent hover:bg-white/5',
                      )}
                      layout={enableListMotion ? 'position' : undefined}
                      style={enableListMotion ? { willChange: 'transform, opacity' } : undefined}
                      initial={reduceMotion || !enableListMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduceMotion || !enableListMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                       transition={
                         reduceMotion || !enableListMotion
                           ? { duration: 0.12 }
                           : { delay: idx * 0.012, duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                       }
                       onMouseEnter={() => {
                         setActiveIndex(idx)
                         if (it.prefetchTo) prefetchIntent(it.prefetchTo)
                       }}
                       onFocus={() => {
                         setActiveIndex(idx)
                         if (it.prefetchTo) prefetchIntent(it.prefetchTo)
                       }}
                       onClick={() => {
                         it.run()
                         onClose()
                       }}
                     >
                      {idx === activeIndex ? (
                        enableActiveMotion ? (
                          <motion.span
                            layoutId="cmdActive"
                            className="pointer-events-none absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/10"
                            transition={{ type: 'spring', stiffness: 520, damping: 36 }}
                          />
                        ) : (
                          <span className="pointer-events-none absolute inset-0 rounded-xl bg-white/10 ring-1 ring-white/10" />
                        )
                      ) : null}

                      <div className="relative z-10 flex w-full items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={cn(
                              'grid h-9 w-9 place-items-center rounded-xl border border-border/70',
                              idx === activeIndex ? 'bg-white/10' : 'bg-white/5',
                            )}
                          >
                            {it.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-medium text-fg">{it.title}</div>
                            {it.subtitle ? <div className="truncate text-xs text-muted/80">{it.subtitle}</div> : null}
                          </div>
                        </div>

                        <div className="hidden shrink-0 items-center gap-2 text-xs text-muted/70 sm:flex">
                          <span className="rounded-lg border border-border/70 bg-white/5 px-2 py-1">Enter</span>
                          <span>入</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )

  return node ? createPortal(node, document.body) : null
}

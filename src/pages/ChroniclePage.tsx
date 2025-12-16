import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Bookmark, BookmarkCheck, Copy, Maximize2, Minimize2, Waypoints } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { getChronicleBySlug } from '../content/chronicles'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { hapticSuccess, hapticTap } from '../lib/haptics'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }
type ReadingLast = {
  slug: string
  title: string
  dateText: string
  sectionId?: string
  anchorId?: string
  anchorHeading?: string
  anchorSnippet?: string
  progress: number
  updatedAt: number
}

export function ChroniclePage() {
  const { slug } = useParams()
  const chronicle = useMemo(() => (slug ? getChronicleBySlug(slug) : null), [slug])
  const reduceMotion = useReducedMotion()
  const [searchParams] = useSearchParams()

  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState<null | 'outline' | 'location'>(null)
  const [activeSectionId, setActiveSectionId] = useState('h-1')
  const [activeParagraphId, setActiveParagraphId] = useState('p-1-1')
  const [resumeFrom] = useState<ReadingLast | null>(() =>
    readJson<ReadingLast | null>(STORAGE_KEYS.readingLast, null),
  )
  const [resumeDismissed, setResumeDismissed] = useState(false)
  const [immersive, setImmersive] = useLocalStorageState<boolean>(STORAGE_KEYS.readingImmersive, false)

  const [bookmarks, setBookmarks] = useLocalStorageState<string[]>(STORAGE_KEYS.bookmarks, [])

  const isBookmarked = chronicle ? bookmarks.includes(chronicle.slug) : false

  const toc = useMemo(() => {
    if (!chronicle) return []
    return chronicle.sections.map((s, idx) => ({ id: `h-${idx + 1}`, heading: s.heading }))
  }, [chronicle])

  const paragraphIndex = useMemo(() => {
    const map = new Map<string, { heading: string; snippet: string; sectionId: string }>()
    if (!chronicle) return map
    chronicle.sections.forEach((s, si) => {
      const sectionId = `h-${si + 1}`
      s.paragraphs.forEach((p, pi) => {
        const id = `p-${si + 1}-${pi + 1}`
        const compact = p.replace(/\s+/g, ' ').trim()
        const snippet = compact.length > 28 ? `${compact.slice(0, 28)}…` : compact
        map.set(id, { heading: s.heading, snippet, sectionId })
      })
    })
    return map
  }, [chronicle])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('reading-immersive', immersive)
    return () => root.classList.remove('reading-immersive')
  }, [immersive])

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      if (max <= 0) return setProgress(0)
      setProgress(Math.max(0, Math.min(100, (doc.scrollTop / max) * 100)))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!chronicle) return
    const t = window.setTimeout(() => {
      setResumeDismissed(false)
      setActiveSectionId('h-1')
      setActiveParagraphId('p-1-1')
    }, 0)
    return () => window.clearTimeout(t)
  }, [slug, chronicle])

  useEffect(() => {
    if (!chronicle) return
    const ids = chronicle.sections.map((_, idx) => `h-${idx + 1}`)
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))
        const top = visible[0]
        setActiveSectionId(top.target.id)
      },
      {
        threshold: [0, 0.12, 0.25, 0.35, 0.5, 0.75, 1],
        rootMargin: '-20% 0px -68% 0px',
      },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [chronicle])

  useEffect(() => {
    if (!chronicle) return
    const ids = chronicle.sections.flatMap((s, si) =>
      s.paragraphs.map((_, pi) => `p-${si + 1}-${pi + 1}`),
    )
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]

    if (elements.length === 0) return
    if (!('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))
        const top = visible[0]
        setActiveParagraphId(top.target.id)
      },
      {
        threshold: [0, 0.08, 0.16, 0.24, 0.35, 0.5, 0.75, 1],
        rootMargin: '-18% 0px -72% 0px',
      },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [chronicle])

  useEffect(() => {
    if (!chronicle) return
    const t = window.setTimeout(() => {
      const p = paragraphIndex.get(activeParagraphId)
      const activeHeading = p?.heading ?? toc.find((t) => t.id === activeSectionId)?.heading
      const payload: ReadingLast = {
        slug: chronicle.slug,
        title: chronicle.title,
        dateText: chronicle.dateText,
        sectionId: activeSectionId,
        anchorId: p ? activeParagraphId : activeSectionId,
        anchorHeading: activeHeading,
        anchorSnippet: p?.snippet,
        progress: Math.round(progress),
        updatedAt: Date.now(),
      }
      writeJson(STORAGE_KEYS.readingLast, payload)
    }, 350)
    return () => window.clearTimeout(t)
  }, [activeParagraphId, activeSectionId, chronicle, paragraphIndex, progress, toc])

  const resumeHint =
    chronicle && resumeFrom?.slug === chronicle.slug && resumeFrom.anchorId && !resumeDismissed
      ? resumeFrom
      : null

  const scrollToAnchor = useCallback(
    (id: string) => {
      const el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    },
    [reduceMotion],
  )

  useEffect(() => {
    if (!chronicle) return
    const target = (searchParams.get('h') ?? '').trim()
    if (!target) return
    const t = window.setTimeout(() => scrollToAnchor(target), 0)
    return () => window.clearTimeout(t)
  }, [chronicle, scrollToAnchor, searchParams])

  if (!chronicle) {
    return (
      <div className="mx-auto max-w-[820px]">
        <Card className="p-8">
          <SectionHeading title="此篇不在卷中" subtitle="可能是旧地址，也可能是你走错了门。" />
          <div className="mt-6">
            <Link to="/chronicles" className="focus-ring tap inline-flex items-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" />
              回到纪事
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const copyOutline = async () => {
    const outline =
      `${chronicle.title}\n${chronicle.dateText}\n\n` +
      chronicle.sections.map((s) => `- ${s.heading}`).join('\n')

    try {
      await navigator.clipboard.writeText(outline)
      hapticTap()
      setCopied('outline')
      window.setTimeout(() => setCopied(null), 900)
    } catch {
      // clipboard 可能被禁用：不强求，只保持静默
      setCopied(null)
    }
  }

  const copyLocation = async () => {
    const anchor = activeParagraphId || activeSectionId || 'h-1'
    const line = `定位：/chronicles/${chronicle.slug}?h=${encodeURIComponent(anchor)}`

    try {
      await navigator.clipboard.writeText(line)
      hapticSuccess()
      setCopied('location')
      window.setTimeout(() => setCopied(null), 900)
    } catch {
      // clipboard 可能被禁用：不强求
      setCopied(null)
    }
  }

  const appendToNotes = () => {
    const now = Date.now()
    const titleLine = `【摘记】${chronicle.title}（${chronicle.dateText}）`
    const body = chronicle.sections
      .slice(0, 2)
      .flatMap((s) => [s.heading, ...s.paragraphs.slice(0, 2)])
      .map((x) => `- ${x}`)
      .join('\n')
    const linkLine = `（来源：纪事《${chronicle.title}》）`

    const snippet = `${titleLine}\n${body}\n${linkLine}`
    const current = readString(STORAGE_KEYS.notes, '')
    const next = current ? `${current}\n\n${snippet}` : snippet
    writeString(STORAGE_KEYS.notes, next)
    const meta = readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 })
    writeJson<NotesMeta>(STORAGE_KEYS.notesMeta, { ...meta, updatedAt: now, lastSource: chronicle.slug })
    hapticSuccess()
  }

  return (
    <>
      <div className="fixed left-0 top-0 z-[65] h-[3px] w-full bg-transparent">
        <div
          className="h-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--accent2)))]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {immersive ? (
        <div className="fixed right-4 top-4 z-[80]">
          <div className="glass flex items-center gap-2 rounded-xl2 px-3 py-2">
            <div className="text-xs text-muted/80">{Math.max(0, Math.min(100, progress)).toFixed(0)}%</div>
            <button
              type="button"
              onClick={() => setImmersive(false)}
              className="focus-ring tap inline-flex items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-3 py-2 text-xs font-medium text-fg/90 hover:bg-white/10"
            >
              <Minimize2 className="h-4 w-4" />
              退出沉浸
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className={immersive ? 'lg:col-span-12' : 'lg:col-span-8'}>
          <Card className="p-7 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link to="/chronicles" className="focus-ring tap inline-flex items-center gap-2 text-sm text-muted/80 hover:text-fg">
                <ArrowLeft className="h-4 w-4" />
                回到纪事
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (isBookmarked) hapticTap()
                    else hapticSuccess()
                    setBookmarks((prev) =>
                      prev.includes(chronicle.slug)
                        ? prev.filter((s) => s !== chronicle.slug)
                        : [...prev, chronicle.slug],
                    )
                  }}
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {isBookmarked ? '已收藏' : '收藏'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setImmersive((v) => !v)}>
                  {immersive ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {immersive ? '退出沉浸' : '沉浸'}
                </Button>
                <Button type="button" variant="ghost" onClick={appendToNotes}>
                  <BookMarkToNotesIcon />
                  收入札记
                </Button>
                <Button type="button" variant="ghost" onClick={copyLocation}>
                  <Waypoints className="h-4 w-4" />
                  复制定位
                </Button>
                <Button type="button" variant="ghost" onClick={copyOutline}>
                  <Copy className="h-4 w-4" />
                  复制提纲
                </Button>
              </div>
            </div>

            <div className="mt-7">
              <Badge className="mb-4">纪事</Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{chronicle.title}</h1>
              <div className="mt-2 text-sm text-muted/80">{chronicle.dateText}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {chronicle.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border/70 bg-white/5 px-3 py-1 text-xs text-muted/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-7 text-muted/85">{chronicle.excerpt}</p>
            </div>

            <div className="mt-8 grid gap-6">
              {chronicle.sections.map((s, idx) => (
                <motion.section
                  key={s.heading}
                  id={`h-${idx + 1}`}
                  className="scroll-mt-28"
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : idx * 0.05, type: 'spring', stiffness: 420, damping: 34 }}
                >
                  <div className="prose prose-xuantian max-w-none">
                    <h2 className="text-lg font-semibold text-fg">{s.heading}</h2>
                    {s.paragraphs.map((p, pi) => {
                      const pid = `p-${idx + 1}-${pi + 1}`
                      return (
                        <p
                          key={pid}
                          id={pid}
                          className={cn(
                            'scroll-mt-28 transition-colors',
                            pid === activeParagraphId && 'rounded-xl bg-white/5 px-4 py-3 outline outline-1 outline-white/10',
                          )}
                        >
                          {p}
                        </p>
                      )
                    })}
                  </div>
                </motion.section>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-border/60 bg-white/4 px-5 py-5 text-sm leading-7 text-muted/85">
              这卷文字只求“像真事”：写得稳、写得细。若你愿意，也可以把自己读到的那一点分寸写进札记里。
            </div>
          </Card>
        </div>

        {!immersive ? (
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-4">
            {resumeHint ? (
              <Card className="p-5">
                <SectionHeading
                  title="续读提示"
                  subtitle={`${Math.max(0, Math.min(100, resumeHint.progress))}% · ${resumeHint.anchorHeading ?? '上次位置'}`}
                />
                <div className="text-xs leading-6 text-muted/80">
                  上次停在《{resumeHint.title}》的某一处。
                  {resumeHint.anchorSnippet ? (
                    <span className="mt-2 block text-muted/70">“{resumeHint.anchorSnippet}”</span>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      scrollToAnchor(resumeHint.anchorId ?? resumeHint.sectionId ?? 'h-1')
                      setResumeDismissed(true)
                    }}
                    className="w-full justify-start"
                  >
                    跳到上次位置
                    <span className="ml-auto text-muted/70">↘</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
                      setResumeDismissed(true)
                    }}
                    className="w-full justify-start"
                  >
                    从头读
                    <span className="ml-auto text-muted/70">↑</span>
                  </Button>
                </div>
              </Card>
            ) : null}
            <Card className="p-5">
              <SectionHeading title="提纲" subtitle="跟着章法走，读起来更稳。" />
              <div className="grid gap-2">
                {toc.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className={cn(
                      'focus-ring tap rounded-xl border border-border/60 px-3 py-2 text-sm',
                      t.id === activeSectionId
                        ? 'bg-white/10 text-fg ring-1 ring-white/10'
                        : 'bg-white/4 text-fg/90 hover:bg-white/7',
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToAnchor(t.id)
                    }}
                  >
                    {t.heading}
                  </a>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeading title="读后可做" subtitle="把所得变成自己的心法。" />
              <div className="grid gap-2">
                <Button type="button" variant="ghost" onClick={appendToNotes} className="w-full justify-start">
                  <BookMarkToNotesIcon />
                  把这一篇收入札记
                </Button>
                <ButtonLinkToNotes />
              </div>

              <AnimatePresence>
                {copied ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-xs text-muted/80"
                  >
                    {copied === 'outline' ? '已复制提纲。' : '已复制定位。'}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Card>
            </div>
          </aside>
        ) : null}
      </div>
    </>
  )
}

function BookMarkToNotesIcon() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-white/10 text-[10px] text-fg/90">
      记
    </span>
  )
}

function ButtonLinkToNotes() {
  return (
    <Link to="/notes" className="focus-ring tap inline-flex w-full items-center gap-2 rounded-xl border border-border/70 bg-white/5 px-4 py-2 text-sm font-medium text-fg/90 hover:bg-white/10">
      去打开札记
      <ArrowRightIcon />
    </Link>
  )
}

function ArrowRightIcon() {
  return <span className="ml-auto text-muted/70">→</span>
}

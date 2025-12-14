import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Copy, ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { getChronicleBySlug } from '../content/chronicles'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }

export function ChroniclePage() {
  const { slug } = useParams()
  const chronicle = useMemo(() => (slug ? getChronicleBySlug(slug) : null), [slug])
  const reduceMotion = useReducedMotion()

  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)

  const [bookmarks, setBookmarks] = useState<string[]>(() =>
    readJson<string[]>(STORAGE_KEYS.bookmarks, []),
  )

  useEffect(() => {
    writeJson(STORAGE_KEYS.bookmarks, bookmarks)
  }, [bookmarks])

  const isBookmarked = chronicle ? bookmarks.includes(chronicle.slug) : false

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

  const toc = chronicle.sections.map((s, idx) => ({ id: `h-${idx + 1}`, heading: s.heading }))

  const copyOutline = async () => {
    const outline =
      `${chronicle.title}\n${chronicle.dateText}\n\n` +
      chronicle.sections.map((s) => `- ${s.heading}`).join('\n')

    try {
      await navigator.clipboard.writeText(outline)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 900)
    } catch {
      // clipboard 可能被禁用：不强求，只保持静默
      setCopied(false)
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
  }

  return (
    <>
      <div className="fixed left-0 top-0 z-[65] h-[3px] w-full bg-transparent">
        <div
          className="h-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--accent2)))]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
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
                  onClick={() =>
                    setBookmarks((prev) =>
                      prev.includes(chronicle.slug)
                        ? prev.filter((s) => s !== chronicle.slug)
                        : [...prev, chronicle.slug],
                    )
                  }
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {isBookmarked ? '已收藏' : '收藏'}
                </Button>
                <Button type="button" variant="ghost" onClick={appendToNotes}>
                  <BookMarkToNotesIcon />
                  收入札记
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
                  <h2 className="text-lg font-semibold text-fg">{s.heading}</h2>
                  <div className="mt-3 grid gap-3">
                    {s.paragraphs.map((p, pi) => (
                      <p key={pi} className="text-sm leading-7 text-muted/85">
                        {p}
                      </p>
                    ))}
                  </div>
                </motion.section>
              ))}
            </div>

            <div className="mt-10 rounded-xl border border-border/60 bg-white/4 px-5 py-5 text-sm leading-7 text-muted/85">
              这卷文字只求“像真事”：写得稳、写得细。若你愿意，也可以把自己读到的那一点分寸写进札记里。
            </div>
          </Card>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <Card className="p-5">
              <SectionHeading title="提纲" subtitle="跟着章法走，读起来更稳。" />
              <div className="grid gap-2">
                {toc.map((t) => (
                  <a
                    key={t.id}
                    href={`#${t.id}`}
                    className={cn(
                      'focus-ring tap rounded-xl border border-border/60 bg-white/4 px-3 py-2 text-sm text-fg/90',
                      'hover:bg-white/7',
                    )}
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
                    已复制提纲。
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </Card>
          </div>
        </aside>
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

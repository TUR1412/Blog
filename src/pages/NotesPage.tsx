import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Download, Eraser, Sparkles, Clipboard, Upload, PencilLine, ScrollText } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SectionHeading } from '../components/ui/SectionHeading'
import { extractMarkdownHeadings, Markdown } from '../components/content/Markdown'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { hapticTap } from '../lib/haptics'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }
type NotesView = 'edit' | 'scroll'
type NotesExportPayload = {
  kind: 'xuantian.notes'
  v: 1
  exportedAt: number
  meta: NotesMeta
  text: string
}

function formatTime(ts: number) {
  if (!ts) return '未保存'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function NotesPage() {
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const importFileRef = useRef<HTMLInputElement | null>(null)
  const flashTimerRef = useRef<number | null>(null)
  const [text, setText] = useState(() => readString(STORAGE_KEYS.notes, ''))
  const [meta, setMeta] = useState<NotesMeta>(() =>
    readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 }),
  )
  const [flash, setFlash] = useState<string | null>(null)
  const [view, setView] = useLocalStorageState<NotesView>(STORAGE_KEYS.notesView, 'edit')
  const [handledAnchor, setHandledAnchor] = useState('')
  const [activeHeadingId, setActiveHeadingId] = useState('')

  const flashMessage = (msg: string) => {
    if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    setFlash(msg)
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 900)
  }

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current)
    }
  }, [])

  const wordCount = useMemo(() => {
    const s = text.trim()
    if (!s) return 0
    return s.replace(/\s+/g, '').length
  }, [text])

  const toc = useMemo(() => extractMarkdownHeadings(text, { idPrefix: 'notes-' }), [text])

  const scrollToHeading = (id: string) => {
    if (!id) return
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  useEffect(() => {
    const fromUrl = searchParams.get('view')
    if (fromUrl === 'edit' || fromUrl === 'scroll') {
      if (fromUrl !== view) setView(fromUrl)
    }
  }, [searchParams, setView, view])

  useEffect(() => {
    if (view !== 'scroll') return
    const h = searchParams.get('h') ?? ''
    if (!h) return
    if (handledAnchor === h) return

    const t = window.setTimeout(() => {
      const el = document.getElementById(h)
      if (el) el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      setHandledAnchor(h)
    }, 0)

    return () => window.clearTimeout(t)
  }, [handledAnchor, reduceMotion, searchParams, view])

  useEffect(() => {
    if (view !== 'scroll') return
    const t = window.setTimeout(() => {
      if (!toc.length) {
        setActiveHeadingId('')
        return
      }
      setActiveHeadingId((prev) => (toc.some((h) => h.id === prev) ? prev : toc[0].id))
    }, 0)

    return () => window.clearTimeout(t)
  }, [toc, view])

  useEffect(() => {
    if (view !== 'scroll') return
    if (!toc.length) return
    if (!('IntersectionObserver' in window)) return

    let observer: IntersectionObserver | null = null
    const t = window.setTimeout(() => {
      const elements = toc
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[]

      if (elements.length === 0) return

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting)
          if (visible.length === 0) return
          visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))
          const top = visible[0]
          setActiveHeadingId(top.target.id)
        },
        {
          threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1],
          rootMargin: '-18% 0px -72% 0px',
        },
      )

      for (const el of elements) observer.observe(el)
    }, 0)

    return () => {
      window.clearTimeout(t)
      observer?.disconnect()
    }
  }, [toc, view])

  useEffect(() => {
    const t = window.setTimeout(() => {
      writeString(STORAGE_KEYS.notes, text)
      setMeta((prev) => {
        const next: NotesMeta = { ...prev, updatedAt: Date.now() }
        writeJson(STORAGE_KEYS.notesMeta, next)
        return next
      })
      flashMessage('已落笔。')
    }, 260)

    return () => window.clearTimeout(t)
  }, [text])

  useEffect(() => {
    if (view !== 'edit') return
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text, view])

  const insertTemplate = () => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const template = [
      `【${stamp} · 修行札记】`,
      '',
      '- 今日看见的“分寸”是什么？',
      '- 今日最想守住的一条规矩是什么？',
      '- 若再走一遍，我会在哪一步慢半拍？',
      '',
      '【摘录】',
      '- （可从纪事页“收入札记”一键带入）',
    ].join('\n')

    setView('edit')
    const next = new URLSearchParams(searchParams)
    next.set('view', 'edit')
    next.delete('h')
    setSearchParams(next, { replace: true })
    setText((prev) => (prev.trim() ? `${prev}\n\n${template}` : template))
    window.setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const exportNotes = () => {
    const blob = new Blob([text || ''], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-notes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportNotesJson = () => {
    const payload: NotesExportPayload = {
      kind: 'xuantian.notes',
      v: 1,
      exportedAt: Date.now(),
      meta,
      text,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `xuantian-notes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyImportedText = (incoming: string) => {
    if (!incoming.trim()) {
      window.alert('导入失败：文件内容为空。')
      return
    }
    const replace = window.confirm('导入方式：确定=覆盖现有札记；取消=追加到现有札记末尾。')
    if (replace) {
      setText(incoming)
      setMeta((prev) => {
        const next: NotesMeta = { ...prev, updatedAt: Date.now() }
        writeJson(STORAGE_KEYS.notesMeta, next)
        return next
      })
      return
    }

    setText((prev) => (prev.trim() ? `${prev}\n\n${incoming}` : incoming))
  }

  const importNotes = async (file: File) => {
    try {
      const raw = await file.text()
      const looksJson = file.name.toLowerCase().endsWith('.json') || raw.trim().startsWith('{')
      if (looksJson) {
        const data = JSON.parse(raw) as Partial<NotesExportPayload> & { text?: unknown; meta?: unknown }
        const incomingText = typeof data.text === 'string' ? data.text : ''
        const incomingMeta = data.meta && typeof data.meta === 'object' ? (data.meta as NotesMeta) : null
        setMeta((prev) => {
          const next: NotesMeta = {
            ...prev,
            ...(incomingMeta ?? {}),
            lastSource: `导入：${file.name}`,
            updatedAt: Date.now(),
          }
          writeJson(STORAGE_KEYS.notesMeta, next)
          return next
        })
        applyImportedText(incomingText)
        flashMessage('已导入。')
        return
      }

      setMeta((prev) => {
        const next: NotesMeta = { ...prev, lastSource: `导入：${file.name}`, updatedAt: Date.now() }
        writeJson(STORAGE_KEYS.notesMeta, next)
        return next
      })
      applyImportedText(raw)
      flashMessage('已导入。')
    } catch {
      window.alert('导入失败：无法读取文件内容。')
    }
  }

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text)
      flashMessage('已复制。')
    } catch {
      // clipboard 可能被禁用：不强求
    }
  }

  const clearAll = () => {
    const ok = window.confirm('确认清空札记？清空后无法恢复（本地存储会被覆盖）。')
    if (!ok) return
    setText('')
    writeString(STORAGE_KEYS.notes, '')
    setMeta((prev) => {
      const next: NotesMeta = { ...prev, updatedAt: Date.now() }
      writeJson(STORAGE_KEYS.notesMeta, next)
      return next
    })
    flashMessage('已清空。')
  }

  const empty = !text.trim()

  return (
    <div className="space-y-6">
      <Card className="p-7 md:p-10">
        <Badge className="mb-4">札记</Badge>
        <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">修行札记</h2>
        <p className="mt-3 max-w-[80ch] text-sm leading-7 text-muted/85">
          你写下的每一句，都会即时存入本地。这里不追求花哨文采，只追求“记得住、用得上”。
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <SectionHeading title="正文" subtitle="输入即保存；刷新不丢。" />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="text-xs text-muted/70">观法</div>
            <Chip
              selected={view === 'edit'}
              onClick={() => {
                setView('edit')
                hapticTap()
                const next = new URLSearchParams(searchParams)
                next.set('view', 'edit')
                next.delete('h')
                setSearchParams(next, { replace: true })
                window.setTimeout(() => textareaRef.current?.focus(), 0)
              }}
              className="inline-flex items-center gap-2"
            >
              <PencilLine className="h-3.5 w-3.5" />
              执笔
            </Chip>
            <Chip
              selected={view === 'scroll'}
              onClick={() => {
                setView('scroll')
                hapticTap()
                const next = new URLSearchParams(searchParams)
                next.set('view', 'scroll')
                setSearchParams(next, { replace: true })
              }}
              className="inline-flex items-center gap-2"
            >
              <ScrollText className="h-3.5 w-3.5" />
              经卷观
            </Chip>
            <div className="ml-auto text-xs text-muted/70">Markdown 排版已启用</div>
          </div>

          {empty ? (
            <div className="rounded-xl border border-border/60 bg-white/4 p-6">
              <div className="flex items-start gap-4">
                <motion.div
                  className="grid h-12 w-12 place-items-center rounded-xl border border-border/70 bg-white/5"
                  animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="h-5 w-5 text-fg/85" />
                </motion.div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-fg">空卷不空心</div>
                  <div className="mt-1 text-sm leading-7 text-muted/85">
                    先写三问，最容易起笔：分寸、规矩、慢半拍。写完再回去读纪事，会更有味道。
                  </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                    <Button type="button" onClick={insertTemplate}>
                      插入“今日三问”
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setView('edit')
                        const next = new URLSearchParams(searchParams)
                        next.set('view', 'edit')
                        next.delete('h')
                        setSearchParams(next, { replace: true })
                        window.setTimeout(() => textareaRef.current?.focus(), 0)
                        hapticTap()
                      }}
                    >
                      直接开写
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {view === 'edit' ? (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              placeholder="写点真话：你今天守住了什么？你今天差点偏到哪里？"
              className={cn(
                'mt-4 w-full rounded-xl border border-border/70 bg-white/4 px-4 py-4',
                'text-sm leading-7 text-fg placeholder:text-muted/70',
                'focus-ring overflow-hidden',
              )}
            />
          ) : (
            <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-5 py-5">
              {text.trim() ? (
                <Markdown text={text} idPrefix="notes-" />
              ) : (
                <div className="text-sm leading-7 text-muted/85">此卷尚空。切回“执笔”，先落一句。</div>
              )}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-4">
          <SectionHeading title="工具" subtitle="小动作要有反馈，手感要 Q。" />

          <input
            ref={importFileRef}
            type="file"
            accept="text/plain,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              e.currentTarget.value = ''
              if (!file) return
              void importNotes(file)
            }}
          />

          <div className="grid gap-2">
            <Button type="button" variant="ghost" onClick={insertTemplate} className="w-full justify-start">
              <Sparkles className="h-4 w-4" />
              插入“今日三问”
            </Button>
            <Button type="button" variant="ghost" onClick={copyAll} className="w-full justify-start" disabled={!text.trim()}>
              <Clipboard className="h-4 w-4" />
              复制全文
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => importFileRef.current?.click()}
              className="w-full justify-start"
            >
              <Upload className="h-4 w-4" />
              导入（文卷/存档）
            </Button>
            <Button type="button" variant="ghost" onClick={exportNotes} className="w-full justify-start" disabled={!text.trim()}>
              <Download className="h-4 w-4" />
              导出文卷
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={exportNotesJson}
              className="w-full justify-start"
              disabled={!text.trim()}
            >
              <Download className="h-4 w-4" />
              导出存档
            </Button>
            <Button type="button" variant="ghost" onClick={clearAll} className="w-full justify-start">
              <Eraser className="h-4 w-4" />
              清空（慎）
            </Button>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
            小提示：<span className="text-fg/85">文卷</span>适合阅读与备份；<span className="text-fg/85">存档</span>保留元信息，便于以后再导入续写。
          </div>

          {view === 'scroll' && toc.length ? (
            <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-fg">经卷目录</div>
                <div className="text-xs text-muted/70">{toc.length} 目</div>
              </div>
              <div className="mt-2 grid gap-1">
                {toc.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={cn(
                      'focus-ring tap w-full rounded-xl border border-border/60 px-3 py-2 text-left text-sm',
                      h.id === activeHeadingId
                        ? 'bg-white/10 text-fg ring-1 ring-white/10'
                        : 'bg-white/4 text-fg/90 hover:bg-white/7',
                    )}
                    style={{ paddingLeft: `${Math.min(20, Math.max(12, 12 + (h.level - 1) * 8))}px` }}
                    onClick={() => {
                      setView('scroll')
                      hapticTap()
                      scrollToHeading(h.id)
                      const next = new URLSearchParams(searchParams)
                      next.set('view', 'scroll')
                      next.set('h', h.id)
                      setSearchParams(next, { replace: true })
                    }}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-xs leading-6 text-muted/75">
                可分享定位：把 <span className="text-fg/85">定位：/notes?view=scroll&amp;h=…</span> 写进札记，即可一键回到此处。
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted/70">字数</div>
              <div className="text-sm font-semibold text-fg">{wordCount}</div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-muted/70">最近保存</div>
              <div className="text-xs text-muted/80">{formatTime(meta.updatedAt)}</div>
            </div>
            {meta.lastSource ? (
              <div className="mt-3 text-xs text-muted/70">
                最近摘记来源：<span className="text-fg/85">{meta.lastSource}</span>
              </div>
            ) : null}
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
      </div>
    </div>
  )
}

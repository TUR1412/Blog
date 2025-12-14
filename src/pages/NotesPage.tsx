import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Download, Eraser, Sparkles, Clipboard } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { readJson, readString, writeJson, writeString } from '../lib/storage'

type NotesMeta = { updatedAt: number; lastSource?: string }

function formatTime(ts: number) {
  if (!ts) return '未保存'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function NotesPage() {
  const reduceMotion = useReducedMotion()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [text, setText] = useState(() => readString(STORAGE_KEYS.notes, ''))
  const [meta, setMeta] = useState<NotesMeta>(() =>
    readJson<NotesMeta>(STORAGE_KEYS.notesMeta, { updatedAt: 0 }),
  )
  const [justSaved, setJustSaved] = useState(false)

  const wordCount = useMemo(() => {
    const s = text.trim()
    if (!s) return 0
    return s.replace(/\s+/g, '').length
  }, [text])

  useEffect(() => {
    const t = window.setTimeout(() => {
      writeString(STORAGE_KEYS.notes, text)
      setMeta((prev) => {
        const next: NotesMeta = { ...prev, updatedAt: Date.now() }
        writeJson(STORAGE_KEYS.notesMeta, next)
        return next
      })
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 700)
    }, 260)

    return () => window.clearTimeout(t)
  }, [text])

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

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setJustSaved(true)
      window.setTimeout(() => setJustSaved(false), 700)
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
                    <Button type="button" variant="ghost" onClick={() => textareaRef.current?.focus()}>
                      直接开写
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={18}
            placeholder="写点真话：你今天守住了什么？你今天差点偏到哪里？"
            className={cn(
              'mt-4 w-full resize-y rounded-xl border border-border/70 bg-white/4 px-4 py-4',
              'text-sm leading-7 text-fg placeholder:text-muted/70',
              'focus-ring',
            )}
          />
        </Card>

        <Card className="lg:col-span-4">
          <SectionHeading title="工具" subtitle="小动作要有反馈，手感要 Q。" />

          <div className="grid gap-2">
            <Button type="button" variant="ghost" onClick={insertTemplate} className="w-full justify-start">
              <Sparkles className="h-4 w-4" />
              插入“今日三问”
            </Button>
            <Button type="button" variant="ghost" onClick={copyAll} className="w-full justify-start" disabled={!text.trim()}>
              <Clipboard className="h-4 w-4" />
              复制全文
            </Button>
            <Button type="button" variant="ghost" onClick={exportNotes} className="w-full justify-start" disabled={!text.trim()}>
              <Download className="h-4 w-4" />
              导出 TXT
            </Button>
            <Button type="button" variant="ghost" onClick={clearAll} className="w-full justify-start">
              <Eraser className="h-4 w-4" />
              清空（慎）
            </Button>
          </div>

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
            {justSaved ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="mt-3 rounded-xl border border-border/60 bg-white/4 px-4 py-3 text-xs text-muted/80"
              >
                已落笔。
              </motion.div>
            ) : null}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}

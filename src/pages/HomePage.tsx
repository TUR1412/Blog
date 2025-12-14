import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { chronicles } from '../content/chronicles'
import { timeline } from '../content/timeline'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { readJson, writeString } from '../lib/storage'
import { useCommandPalette } from '../providers/command/CommandPaletteProvider'

type Burst = { id: string; x: number; y: number }
type ReadingLast = {
  slug: string
  title: string
  dateText: string
  anchorHeading?: string
  progress: number
  updatedAt: number
}

function SparkBurstLayer({ bursts }: { bursts: Burst[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[75]">
      {bursts.map((b) => (
        <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 18
            const distance = 86 + (i % 3) * 14
            const x = Math.cos(angle) * distance
            const y = Math.sin(angle) * distance
            const hue = (i * 24 + 190) % 360
            return (
              <motion.span
                key={i}
                className="absolute left-0 top-0 block h-2 w-2 rounded-full"
                style={{
                  background: `hsl(${hue} 92% 62%)`,
                  boxShadow: `0 0 18px hsl(${hue} 92% 62% / 0.45)`,
                }}
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                animate={{ opacity: [0, 1, 0], x, y, scale: [0.4, 1, 0.9] }}
                transition={{ duration: 0.85, ease: [0.2, 0.9, 0.2, 1] }}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function HomePage() {
  const { open } = useCommandPalette()
  const featured = useMemo(() => chronicles.slice(0, 3), [])
  const [qi, setQi] = useState(72)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [readingLast, setReadingLast] = useState<ReadingLast | null>(() =>
    readJson<ReadingLast | null>(STORAGE_KEYS.readingLast, null),
  )
  const [bookmarks] = useState<string[]>(() => readJson<string[]>(STORAGE_KEYS.bookmarks, []))

  const quotes = useMemo(
    () => [
      '胜负要分清，分寸要留住。',
      '名声若换便宜，迟早要还利息。',
      '规矩若不束强者，就只是纸。',
      '小事做得像样，心就不会走偏。',
      '稳不是慢，是不乱。',
    ],
    [],
  )

  const quote = quotes[quoteIndex % quotes.length]

  const triggerBurst = (x: number, y: number) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setBursts((prev) => [...prev, { id, x, y }])
    window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 900)
  }

  return (
    <>
      <SparkBurstLayer bursts={bursts} />

      <div className="space-y-6">
        <section className="glass relative overflow-hidden rounded-xl2 p-6 md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.45),transparent_62%)] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.42),transparent_62%)] blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <Badge className="mb-4">修仙题材 · 纪事与人物志</Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                轩天帝 · 轩少
              </h1>
              <p className="mt-3 max-w-[62ch] text-sm leading-7 text-muted/85 sm:text-base">
                这是一卷“像真事”的记录：不写夸饰，不写旁门，只记他的行止、分寸与规矩。
                若你愿意慢一点读，许多细节会自己发光。
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <ButtonLink to="/chronicles">
                  入卷
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink to="/about" variant="ghost">
                  人物志
                </ButtonLink>
                <Button type="button" variant="ghost" onClick={open}>
                  灵镜检索
                  <span className="hidden rounded-lg border border-border/70 bg-white/5 px-2 py-1 text-xs text-muted/80 sm:inline">
                    Ctrl/⌘ K
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
                    triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2)
                    setQuoteIndex((i) => i + 1)
                  }}
                >
                  顿悟一下
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-6 text-sm text-muted/85">
                <span className="mr-2 text-xs text-muted/70">箴言</span>
                <span className="font-medium text-fg/90">“{quote}”</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Card className="p-4">
                  <div className="text-xs text-muted/80">道号</div>
                  <div className="mt-1 text-base font-semibold text-fg">轩天帝（人多仍唤：轩少）</div>
                  <div className="mt-2 text-xs text-muted/70">
                    名号不为夸饰，多用于公议文书。
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted/80">行止</div>
                  <div className="mt-1 text-base font-semibold text-fg">稳、细、讲边界</div>
                  <div className="mt-2 text-xs text-muted/70">擂台留一线，救荒讲次序。</div>
                </Card>
                <Card className="p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted/80">卷中标记</div>
                    <div className="text-xs text-muted/70">收藏 {bookmarks.length}</div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-muted/70">
                    你收藏的篇章会留在本地；在“纪事”里可一键只看收藏。
                  </div>
                  <div className="mt-3">
                    <ButtonLink to="/chronicles?only=bookmarks" variant="ghost" className="w-full">
                      只看收藏 <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>
                </Card>
                <Card className="p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted/80">灵气仪（只是隐喻）</div>
                    <div className="text-xs font-medium text-fg/90">{qi}%</div>
                  </div>
                  <input
                    className="mt-3 w-full accent-[hsl(var(--accent))]"
                    type="range"
                    min={0}
                    max={100}
                    value={qi}
                    onChange={(e) => setQi(Number(e.target.value))}
                  />
                  <div className="mt-2 text-xs text-muted/70">
                    高不代表强，稳才代表“不会乱”。
                  </div>
                </Card>
                <Card className="p-4 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted/80">继续上次一卷</div>
                    <div className="text-xs text-muted/70">
                      {readingLast ? `${readingLast.progress}%` : '未有续读'}
                    </div>
                  </div>

                  {readingLast ? (
                    <div className="mt-2">
                      <div className="text-sm font-semibold text-fg line-clamp-2">
                        {readingLast.title}
                      </div>
                      <div className="mt-1 text-xs text-muted/70">{readingLast.dateText}</div>
                      {readingLast.anchorHeading ? (
                        <div className="mt-1 text-xs text-muted/70">
                          上次停在：{readingLast.anchorHeading}
                        </div>
                      ) : null}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/6">
                        <div
                          className="h-full bg-[linear-gradient(90deg,hsl(var(--accent)),hsl(var(--accent2)))]"
                          style={{ width: `${Math.max(2, Math.min(100, readingLast.progress))}%` }}
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <ButtonLink
                          to={`/chronicles/${readingLast.slug}`}
                          variant="ghost"
                          className="w-full"
                        >
                          续读 <ArrowRight className="h-4 w-4" />
                        </ButtonLink>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            writeString(STORAGE_KEYS.readingLast, '')
                            setReadingLast(null)
                          }}
                        >
                          清除
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 text-xs leading-6 text-muted/70">
                      打开任意一篇纪事阅读片刻，系统会自动记住“上次读到哪里”。
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <SectionHeading title="近三篇纪事" subtitle="从“像真事”的细节里入门。" />
            <div className="grid gap-2">
              {featured.map((c, idx) => (
                <Link
                  key={c.slug}
                  to={`/chronicles/${c.slug}`}
                  className={cn(
                    'focus-ring tap group rounded-xl border border-border/60 bg-white/4 px-4 py-4',
                    'hover:bg-white/7',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-fg">
                        {idx + 1}. {c.title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-6 text-muted/80">
                        {c.excerpt}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted/70">
                        <span>{c.dateText}</span>
                        <span className="opacity-50">·</span>
                        <span>{c.tags.join(' · ')}</span>
                      </div>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted/70 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-muted/70">想读更多，就去“纪事”。</div>
              <ButtonLink to="/chronicles" variant="ghost" className="px-3 py-1.5">
                继续入卷 <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Card>

          <Card className="lg:col-span-5">
            <SectionHeading title="年表摘记" subtitle="只取几个关键节点，不夸大，不虚浮。" />
            <div className="grid gap-3">
              {timeline.slice(0, 5).map((t) => (
                <div key={t.id} className="rounded-xl border border-border/60 bg-white/4 px-4 py-3">
                  <div className="text-xs text-muted/70">{t.when}</div>
                  <div className="mt-1 text-sm font-semibold text-fg">{t.title}</div>
                  <div className="mt-1 text-xs leading-6 text-muted/80">{t.detail}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted/70">年表详录在“人物志”。</div>
              <ButtonLink to="/about" variant="ghost" className="px-3 py-1.5">
                去看人物志 <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Card>

          <Card className="lg:col-span-4">
            <SectionHeading title="札记" subtitle="写下当日心法，刷新不丢。" />
            <div className="rounded-xl border border-border/60 bg-white/4 px-4 py-4">
              <div className="text-sm font-semibold text-fg">修行札记</div>
              <div className="mt-1 text-xs leading-6 text-muted/80">
                你写下的内容会即时存入本地，不怕误刷新。把“你看到的分寸”记下来，久了就成心法。
              </div>
              <div className="mt-3">
                <ButtonLink to="/notes" variant="ghost" className="w-full">
                  打开札记 <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-8">
            <SectionHeading title="藏品小录" subtitle="可拖拽排序，像把旧物摆回心里合适的位置。" />
            <div className="grid gap-2 sm:grid-cols-2">
              {['旧茶盏', '门外灯芯', '点脊剑', '药单册'].map((name) => (
                <div key={name} className="rounded-xl border border-border/60 bg-white/4 px-4 py-4">
                  <div className="text-sm font-semibold text-fg">{name}</div>
                  <div className="mt-1 text-xs text-muted/80">点进“藏品”可拖拽整理。</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end">
              <ButtonLink to="/treasury" variant="ghost" className="px-3 py-1.5">
                去整理藏品 <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

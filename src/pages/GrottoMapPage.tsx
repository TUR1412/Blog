import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, BookOpen, Compass } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { timeline, type TimelineEvent } from '../content/timeline'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'

function toneClass(tone: TimelineEvent['tone']) {
  if (tone === 'bright') return 'from-[hsl(var(--accent)/.22)] via-white/8 to-transparent'
  if (tone === 'warn') return 'from-[hsl(var(--warn)/.18)] via-white/8 to-transparent'
  return 'from-white/10 via-white/6 to-transparent'
}

export function GrottoMapPage() {
  const reduceMotion = useReducedMotion()
  const [searchParams, setSearchParams] = useSearchParams()
  const [storedSelectedId, setStoredSelectedId] = useLocalStorageState<string>(
    STORAGE_KEYS.grottoSelected,
    '',
  )

  const byId = useMemo(() => new Map(timeline.map((t) => [t.id, t] as const)), [])

  const selectedId = useMemo(() => {
    const fromUrl = searchParams.get('id')
    if (fromUrl && byId.has(fromUrl)) return fromUrl
    if (storedSelectedId && byId.has(storedSelectedId)) return storedSelectedId
    return timeline[0]?.id ?? ''
  }, [byId, searchParams, storedSelectedId])

  const selected = selectedId ? byId.get(selectedId) ?? null : null

  useEffect(() => {
    if (!selectedId) return
    setStoredSelectedId(selectedId)
  }, [selectedId, setStoredSelectedId])

  useEffect(() => {
    if (!selectedId) return
    const fromUrl = searchParams.get('id')
    if (fromUrl === selectedId) return
    const next = new URLSearchParams(searchParams)
    next.set('id', selectedId)
    setSearchParams(next, { replace: true })
  }, [searchParams, selectedId, setSearchParams])

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-7 md:p-10">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.36),transparent_62%)] blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.30),transparent_62%)] blur-3xl" />

        <div className="relative">
          <Badge className="mb-4">洞府图</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">一条路，几处关口</h2>
          <p className="mt-3 max-w-[86ch] text-sm leading-7 text-muted/85">
            把年表写成“路”，不是为了神话谁，而是为了把分寸看清：哪一步靠守诺，哪一步靠边界，哪一步靠把次序留给后来人。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/chronicles">去读纪事</ButtonLink>
            <ButtonLink to="/about" variant="ghost">
              看人物志
            </ButtonLink>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <SectionHeading title="灵脉路标" subtitle="点任一节点，右侧会展开细节与去处。" />

          <div className="relative">
            <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />

            <div className="grid gap-3">
              {timeline.map((t, idx) => {
                const left = idx % 2 === 0
                const active = t.id === selectedId
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'relative flex',
                      left ? 'justify-start pr-12' : 'justify-end pl-12',
                    )}
                  >
                    <motion.button
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams)
                        next.set('id', t.id)
                        setSearchParams(next, { replace: true })
                      }}
                      className={cn(
                        'focus-ring tap relative w-full max-w-[520px] rounded-xl border bg-white/4 px-5 py-4 text-left',
                        active
                          ? 'border-white/20 bg-white/8 ring-1 ring-white/10'
                          : 'border-border/60 hover:bg-white/7',
                      )}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: reduceMotion ? 0 : idx * 0.02,
                        type: 'spring',
                        stiffness: 420,
                        damping: 34,
                        mass: 0.9,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-muted/70">{t.when}</div>
                          <div className="mt-1 text-sm font-semibold text-fg">{t.title}</div>
                          <div className="mt-2 text-xs leading-6 text-muted/80">{t.detail}</div>
                        </div>
                        <div className="mt-1 shrink-0 text-xs text-muted/70">
                          {active ? '已选' : '选'}
                        </div>
                      </div>
                    </motion.button>

                    <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2">
                      <div
                        className={cn(
                          'grid h-8 w-8 place-items-center rounded-full border',
                          active
                            ? 'border-white/20 bg-white/10 text-fg'
                            : 'border-white/12 bg-white/6 text-muted/70',
                        )}
                      >
                        <Compass className={cn('h-4 w-4', active && 'text-fg')} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <SectionHeading title="节点详记" subtitle="不写玄虚，只写可落地的行止。" />

          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
              >
                <div className={cn('rounded-xl bg-gradient-to-r p-[1px]', toneClass(selected.tone))}>
                  <div className="rounded-xl bg-[hsl(var(--card)/.55)] px-5 py-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-muted/70">{selected.when}</div>
                        <div className="mt-1 text-lg font-semibold text-fg">{selected.title}</div>
                      </div>
                      <div className="shrink-0 rounded-xl border border-border/70 bg-white/5 px-3 py-2 text-xs text-muted/80">
                        路标
                      </div>
                    </div>

                    <div className="mt-3 text-sm leading-7 text-muted/85">
                      {selected.long ?? selected.detail}
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

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? 'auto' : 'smooth' })}
                        className="justify-start"
                      >
                        回到页首
                        <span className="ml-auto text-muted/70">↑</span>
                      </Button>
                    </div>

                    <div className="mt-5 rounded-xl border border-border/60 bg-white/4 px-4 py-4 text-xs leading-6 text-muted/80">
                      读法建议：先看“节点详记”，再去读对应纪事，最后把你自己的分寸写进札记——久了就成心法。
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.9 }}
                className="rounded-xl border border-border/60 bg-white/4 px-5 py-10 text-center"
              >
                <div className="text-sm font-semibold text-fg">暂无节点</div>
                <div className="mt-2 text-xs leading-6 text-muted/80">年表为空时，这里会保持安静。</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}

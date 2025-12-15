import { motion } from 'framer-motion'
import { BookOpen, Scale, ShieldCheck, Snowflake } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeading } from '../components/ui/SectionHeading'
import { timeline, timelineLayerLabel } from '../content/timeline'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { cn } from '../lib/cn'

const TIMELINE_OPEN_KEY = 'xuantian.timeline.open.v1'

export function AboutPage() {
  const [openIds, setOpenIds] = useLocalStorageState<Record<string, boolean>>(TIMELINE_OPEN_KEY, {})

  const principles = useMemo(
    () => [
      {
        icon: <Scale className="h-4 w-4" />,
        title: '先立边界',
        detail: '强者也要被约束；没有边界的威望，只会变成压迫。',
      },
      {
        icon: <ShieldCheck className="h-4 w-4" />,
        title: '不借名头',
        detail: '能用银钱解决的事，不用身份去换；欠什么就还什么。',
      },
      {
        icon: <Snowflake className="h-4 w-4" />,
        title: '稳而不慢',
        detail: '稳是“不乱”，不是拖延；该快时快，该止时止。',
      },
      {
        icon: <BookOpen className="h-4 w-4" />,
        title: '把次序留给后人',
        detail: '比起一时的救急，他更在意“下一次还能用”的章法。',
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden p-7 md:p-10">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent2)/.36),transparent_62%)] blur-3xl" />
        <div className="absolute -left-16 -bottom-24 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)/.34),transparent_62%)] blur-3xl" />

        <div className="relative">
          <Badge className="mb-4">人物志</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">轩少其人</h2>
          <p className="mt-3 max-w-[70ch] text-sm leading-7 text-muted/85">
            这里记的是修仙题材纪事——不写编外话，也不拿夸张当气势。轩少后来被称为“轩天帝”，
            多因乱局里需要一把秤；他愿意端稳秤，但从不拿秤去压人。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/chronicles">去读纪事</ButtonLink>
            <ButtonLink to="/grotto" variant="ghost">
              去看洞府图
            </ButtonLink>
            <ButtonLink to="/relations" variant="ghost">
              看关系谱
            </ButtonLink>
            <ButtonLink to="/notes" variant="ghost">
              抄下自己的札记
            </ButtonLink>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <SectionHeading
            title="行止与分寸"
            subtitle="他不靠“更响的口号”，靠的是长期可验证的做法。"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {principles.map((p) => (
              <div
                key={p.title}
                className="tap rounded-xl border border-border/60 bg-white/4 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-white/5 text-fg/90">
                    {p.icon}
                  </div>
                  <div className="text-sm font-semibold text-fg">{p.title}</div>
                </div>
                <div className="mt-2 text-xs leading-6 text-muted/80">{p.detail}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-border/60 bg-white/4 px-5 py-5">
            <div className="text-sm font-semibold text-fg">关于“天帝”二字</div>
            <div className="mt-2 text-sm leading-7 text-muted/85">
              “天帝”在这里更多是一个公议职分：用于协调灵脉争端、救灾公费、宗门边界与誓词对照。
              若把它当成“凌驾众人”的荣耀，就会离轩少越来越远。人们私下仍叫他“轩少”，并非不敬，
              而是记得他最初那盏旧灯与那段挑水的日子。
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <SectionHeading
            title="年表详录"
            subtitle="点击条目可展开；状态会记住，不怕刷新。"
          />

          <div className="grid gap-2">
            {timeline.map((t) => {
              const open = Boolean(openIds[t.id])
              const tone =
                t.tone === 'bright'
                  ? 'from-[hsl(var(--accent)/.14)] to-transparent'
                  : t.tone === 'warn'
                    ? 'from-[hsl(var(--warn)/.14)] to-transparent'
                    : 'from-white/8 to-transparent'

              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-xl border border-border/60 bg-white/4 text-left',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIds((prev) => ({ ...prev, [t.id]: !open }))}
                    className={cn(
                      'focus-ring tap w-full rounded-xl px-4 py-3 text-left',
                      'hover:bg-white/7',
                    )}
                    aria-expanded={open}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted/70">
                          <span>{t.when}</span>
                          <span className="rounded-full border border-border/70 bg-white/5 px-2 py-0.5 text-[11px] text-muted/80">
                            {timelineLayerLabel(t.layer)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-fg">{t.title}</div>
                        <div className="mt-1 text-xs leading-6 text-muted/80">{t.detail}</div>
                      </div>
                      <div className="mt-1 shrink-0 text-xs text-muted/70">{open ? '收' : '展'}</div>
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    className="overflow-hidden"
                  >
                    <div className={cn('mx-4 mb-4 mt-3 rounded-xl bg-gradient-to-r px-4 py-3', tone)}>
                      <div className="text-xs leading-6 text-muted/85">
                        {t.long
                          ? t.long
                          : `${t.title}之后，轩少并未“立刻变得更高”。他的变化往往发生在细处：对誓词的对照、对病人的回访、对争端的边界书写。凡能写成章法的，他都尽量写清。`}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <ButtonLink to={`/grotto?id=${t.id}`} variant="ghost" className="px-3 py-1.5 text-xs">
                          在洞府图定位
                        </ButtonLink>
                        {t.chronicleSlug ? (
                          <ButtonLink
                            to={`/chronicles/${t.chronicleSlug}`}
                            variant="ghost"
                            className="px-3 py-1.5 text-xs"
                          >
                            去读对应纪事
                          </ButtonLink>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

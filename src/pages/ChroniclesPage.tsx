import { ArrowRight, Filter, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { SectionHeading } from '../components/ui/SectionHeading'
import { chronicles, getAllTags } from '../content/chronicles'
import { cn } from '../lib/cn'
import { STORAGE_KEYS } from '../lib/constants'
import { readJson, readString, writeString } from '../lib/storage'

export function ChroniclesPage() {
  const tags = useMemo(() => ['全部', ...getAllTags()], [])
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [bookmarks] = useState<string[]>(() => readJson<string[]>(STORAGE_KEYS.bookmarks, []))

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

  const filtered = useMemo(() => {
    const q = query.trim()
    return chronicles.filter((c) => {
      if (onlyBookmarks && !bookmarks.includes(c.slug)) return false
      const tagOk = selectedTag === '全部' ? true : c.tags.includes(selectedTag)
      if (!tagOk) return false
      if (!q) return true
      const hay = `${c.title} ${c.excerpt} ${c.tags.join(' ')} ${c.dateText}`
      return hay.includes(q)
    })
  }, [bookmarks, onlyBookmarks, query, selectedTag])

  const bookmarkedChronicles = useMemo(() => {
    const map = new Map(chronicles.map((c) => [c.slug, c] as const))
    return bookmarks.map((s) => map.get(s)).filter(Boolean)
  }, [bookmarks])

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
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.delete('only')
                setSearchParams(next, { replace: true })
              }}
            >
              全部
            </Chip>
            <Chip
              selected={onlyBookmarks}
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('only', 'bookmarks')
                setSearchParams(next, { replace: true })
              }}
            >
              收藏（{bookmarks.length}）
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
                onClick={() => {
                  const next = new URLSearchParams(searchParams)
                  if (t === '全部') next.delete('tag')
                  else next.set('tag', t)
                  setSearchParams(next, { replace: true })
                  if (t !== '全部') writeString(STORAGE_KEYS.tagFilter, t)
                }}
              >
                {t}
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

          <div className="grid gap-2">
            {filtered.map((c) => (
              <Link
                key={c.slug}
                to={`/chronicles/${c.slug}`}
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
            ))}
          </div>

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

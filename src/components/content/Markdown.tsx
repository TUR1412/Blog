import ReactMarkdown, { type Components } from 'react-markdown'
import { isValidElement, memo, useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '../../lib/cn'

export type MarkdownHighlightOptions = {
  /** 是否区分大小写；默认 false（不区分）。 */
  matchCase?: boolean
  /** 是否整词匹配；仅对纯字母/数字/下划线有效。 */
  wholeWord?: boolean
  /** 忽略标点/空白：允许在匹配字符间跨过标点与空格。 */
  ignorePunctuation?: boolean
}

export const DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS: Required<MarkdownHighlightOptions> = {
  matchCase: false,
  wholeWord: false,
  ignorePunctuation: false,
}

type MarkdownProps = {
  text: string
  className?: string
  /** 将“【标题】”行转换为 Markdown 标题，便于经卷观排版。 */
  bracketHeadings?: boolean
  /** 将“定位：/path?query”转换为可点击链接。 */
  linkifyLocations?: boolean
  /** 生成标题定位 ID 的前缀；用于避免同页多份经卷时出现重复 ID。 */
  idPrefix?: string
  /** 高亮检索词（用于经卷内检索）。为空时不启用高亮。 */
  highlightQuery?: string
  /** 高亮检索的匹配规则（区分大小写/整词/忽略标点）。 */
  highlightOptions?: MarkdownHighlightOptions
  /** 高亮命中的范围标记（便于页面内检索 DOM）。 */
  highlightScope?: string
  /** 高亮命中的 ID 前缀（用于滚动定位）。 */
  highlightIdPrefix?: string
  /** 当前激活的命中序号（用于“上一处/下一处”） */
  activeHighlightIndex?: number
}

export type MarkdownHeading = {
  id: string
  level: number
  text: string
}

function flattenText(node: ReactNode): string {
  if (node == null) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flattenText).join('')
  if (isValidElement<{ children?: ReactNode }>(node)) return flattenText(node.props.children)
  return ''
}

function slugifyHeading(rawText: string, used: Set<string>, prefix: string) {
  const base = rawText
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^0-9a-zA-Z\u4e00-\u9fff_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')

  const safeBase = base || 'section'
  let slug = safeBase
  let i = 2
  while (used.has(slug)) {
    slug = `${safeBase}-${i}`
    i += 1
  }
  used.add(slug)
  return `${prefix}${slug}`
}

export function normalizeXuantianMarkdown(
  raw: string,
  opts: { bracketHeadings: boolean; linkifyLocations: boolean },
): string {
  const normalized = raw.replace(/\r\n/g, '\n')
  if (!normalized.trim()) return ''

  const lines = normalized.split('\n').map((line) => line.replace(/\s+$/g, ''))
  const out: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      out.push('')
      continue
    }

    if (opts.bracketHeadings && !trimmed.startsWith('#')) {
      const m = trimmed.match(/^【(.+?)】$/)
      if (m?.[1]) {
        out.push(`## ${m[1].trim()}`)
        continue
      }
    }

    if (opts.linkifyLocations) {
      const m = trimmed.match(/^定位：\s*(\/[^\s]+)$/)
      if (m?.[1]) {
        const path = m[1]
        out.push(`定位：[${path}](${path})`)
        continue
      }
    }

    out.push(line)
  }

  return out.join('\n')
}

export function extractMarkdownHeadings(
  raw: string,
  opts?: { bracketHeadings?: boolean; linkifyLocations?: boolean; idPrefix?: string },
): MarkdownHeading[] {
  const bracketHeadings = opts?.bracketHeadings ?? true
  const linkifyLocations = opts?.linkifyLocations ?? true
  const idPrefix = opts?.idPrefix ?? ''
  const md = normalizeXuantianMarkdown(raw, { bracketHeadings, linkifyLocations })
  if (!md.trim()) return []

  const used = new Set<string>()
  const out: MarkdownHeading[] = []
  const lines = md.split('\n')
  let inFence = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/)
    if (!m?.[1] || !m[2]) continue
    const level = m[1].length
    const text = m[2].replace(/\s+#+\s*$/g, '').trim()
    if (!text) continue
    const id = slugifyHeading(text, used, idPrefix)
    out.push({ id, level, text })
  }
  return out
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildHighlightRegExp(queryRaw: string, opts: MarkdownHighlightOptions): RegExp | null {
  const q = queryRaw.trim()
  if (!q) return null

  const matchCase = opts.matchCase ?? DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS.matchCase
  const wholeWord = opts.wholeWord ?? DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS.wholeWord
  const ignorePunctuation = opts.ignorePunctuation ?? DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS.ignorePunctuation

  let pattern = ''

  if (ignorePunctuation) {
    const compact = q.replace(/[\s\p{P}\p{S}]+/gu, '')
    const parts = Array.from(compact)
    if (!parts.length) return null
    const sep = `[\\s\\p{P}\\p{S}]*`
    pattern = parts.map(escapeRegExp).join(sep)
  } else {
    pattern = escapeRegExp(q)
    const canWholeWord = wholeWord && /^[0-9A-Za-z_]+$/.test(q)
    if (canWholeWord) pattern = `\\b${pattern}\\b`
  }

  const flags = matchCase ? 'gu' : 'giu'
  return new RegExp(pattern, flags)
}

function buildRehypeHighlight(opts: {
  query: string
  options: MarkdownHighlightOptions
  scope: string
  idPrefix: string
  activeIndex: number
}) {
  const re = buildHighlightRegExp(opts.query, opts.options)
  if (!re) return null
  const skipTags = new Set(['pre', 'code', 'script', 'style'])

  return function rehypeXuantianHighlight(tree: unknown) {
    let hit = 0

    const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

    const walk = (node: unknown) => {
      if (!isRecord(node)) return

      if (node.type === 'element') {
        const tag = typeof node.tagName === 'string' ? node.tagName : ''
        if (skipTags.has(tag)) return
      }

      const children = Array.isArray(node.children) ? node.children : null
      if (!children || children.length === 0) return

      const nextChildren: unknown[] = []
      for (const child of children) {
        if (isRecord(child) && child.type === 'text' && typeof child.value === 'string') {
          const value = child.value
          if (!value) {
            nextChildren.push(child)
            continue
          }

          let last = 0
          re.lastIndex = 0
          let m: RegExpExecArray | null
          let replaced = false
          while ((m = re.exec(value))) {
            const start = m.index ?? 0
            const end = start + (m[0]?.length ?? 0)
            if (end <= start) break

            if (start > last) {
              nextChildren.push({ type: 'text', value: value.slice(last, start) })
            }

            const idx = hit
            const id = `${opts.idPrefix}${idx}`
            const active = idx === opts.activeIndex
            nextChildren.push({
              type: 'element',
              tagName: 'mark',
              properties: {
                id,
                'data-x-hit': opts.scope,
                'data-x-idx': String(idx),
                ...(active ? { 'data-x-active': '1' } : null),
              },
              children: [{ type: 'text', value: value.slice(start, end) }],
            })

            hit += 1
            last = end
            replaced = true
          }

          if (!replaced) {
            nextChildren.push(child)
            continue
          }

          if (last < value.length) {
            nextChildren.push({ type: 'text', value: value.slice(last) })
          }
          continue
        }

        walk(child)
        nextChildren.push(child)
      }

      node.children = nextChildren
    }

    walk(tree)
  }
}

function buildComponents(opts: { idPrefix: string }): Components {
  const used = new Set<string>()

  const linkRenderer: Components['a'] = ({ href, children }) => {
    const h = typeof href === 'string' ? href : ''
    const isInternal = h.startsWith('/') && !h.startsWith('//')
    const isHash = h.startsWith('#')

    if (isHash) {
      return (
        <a
          href={h}
          className="focus-ring tap"
          onClick={(e) => {
            e.preventDefault()
            const id = h.slice(1)
            if (!id) return
            const el = document.getElementById(id)
            if (!el) return
            const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
            el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
          }}
        >
          {children}
        </a>
      )
    }

    if (isInternal) {
      return (
        <Link to={h} className="focus-ring tap">
          {children}
        </Link>
      )
    }
    return (
      <a href={h} target="_blank" rel="noreferrer" className="focus-ring tap">
        {children}
      </a>
    )
  }

  const codeRenderer: Components['code'] = ({ className, children, node, ...props }) => {
    void node
    return (
      <code className={cn('font-medium', className)} {...props}>
        {children}
      </code>
    )
  }

  const imgRenderer: Components['img'] = ({ src, alt, className, node, ...props }) => {
    void node
    const s = typeof src === 'string' ? src : ''
    const a = typeof alt === 'string' ? alt : ''
    return (
      <img
        src={s}
        alt={a}
        loading="lazy"
        decoding="async"
        className={cn('rounded-2xl border border-border/60 bg-white/2 shadow-lift', className)}
        {...props}
      />
    )
  }

  const tableRenderer: Components['table'] = ({ children, className, node, ...props }) => {
    void node
    return (
      <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-border/60 bg-white/4 shadow-lift">
        <table className={cn('w-full min-w-[560px] border-collapse text-sm', className)} {...props}>
          {children}
        </table>
      </div>
    )
  }

  const theadRenderer: Components['thead'] = ({ children, className, node, ...props }) => {
    void node
    return (
      <thead className={cn('bg-white/5 text-xs font-semibold text-fg/90', className)} {...props}>
        {children}
      </thead>
    )
  }

  const tbodyRenderer: Components['tbody'] = ({ children, className, node, ...props }) => {
    void node
    return (
      <tbody
        className={cn('divide-y divide-border/50 [&>tr:nth-child(even)]:bg-white/2', className)}
        {...props}
      >
        {children}
      </tbody>
    )
  }

  const thRenderer: Components['th'] = ({ children, className, node, ...props }) => {
    void node
    return (
      <th
        className={cn('whitespace-nowrap border-b border-border/60 px-4 py-3 text-left font-semibold text-fg/90', className)}
        {...props}
      >
        {children}
      </th>
    )
  }

  const tdRenderer: Components['td'] = ({ children, className, node, ...props }) => {
    void node
    return (
      <td className={cn('px-4 py-3 align-top text-fg/85', className)} {...props}>
        {children}
      </td>
    )
  }

  const makeHeading =
    (Tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'): Components[typeof Tag] =>
    ({ className, children, node, ...props }) => {
      void node
      const text = flattenText(children)
      const id = text ? slugifyHeading(text, used, opts.idPrefix) : ''
      return (
        <Tag id={id || undefined} className={cn('scroll-mt-28', className)} {...props}>
          {children}
        </Tag>
      )
    }

  return {
    a: linkRenderer,
    code: codeRenderer,
    img: imgRenderer,
    table: tableRenderer,
    thead: theadRenderer,
    tbody: tbodyRenderer,
    th: thRenderer,
    td: tdRenderer,
    h1: makeHeading('h1'),
    h2: makeHeading('h2'),
    h3: makeHeading('h3'),
    h4: makeHeading('h4'),
    h5: makeHeading('h5'),
    h6: makeHeading('h6'),
  }
}

export const Markdown = memo(function Markdown({
  text,
  className,
  bracketHeadings = true,
  linkifyLocations = true,
  idPrefix = '',
  highlightQuery,
  highlightOptions,
  highlightScope = 'md',
  highlightIdPrefix,
  activeHighlightIndex = 0,
}: MarkdownProps) {
  const md = useMemo(
    () => normalizeXuantianMarkdown(text, { bracketHeadings, linkifyLocations }),
    [bracketHeadings, linkifyLocations, text],
  )
  const hasContent = md.trim().length > 0

  const q = typeof highlightQuery === 'string' ? highlightQuery.trim() : ''
  const hOpts = useMemo(
    () => ({
      matchCase: highlightOptions?.matchCase ?? DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS.matchCase,
      wholeWord: highlightOptions?.wholeWord ?? DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS.wholeWord,
      ignorePunctuation: highlightOptions?.ignorePunctuation ?? DEFAULT_MARKDOWN_HIGHLIGHT_OPTIONS.ignorePunctuation,
    }),
    [highlightOptions?.ignorePunctuation, highlightOptions?.matchCase, highlightOptions?.wholeWord],
  )
  const scope = (highlightScope || 'md').trim() || 'md'
  const hitIdPrefix = typeof highlightIdPrefix === 'string' ? highlightIdPrefix : `${scope}-hit-`
  const activeIdx = Number.isFinite(activeHighlightIndex) ? activeHighlightIndex : 0

  const highlight = useMemo(() => {
    if (!q) return null
    return buildRehypeHighlight({
      query: q,
      options: hOpts,
      scope,
      idPrefix: hitIdPrefix,
      activeIndex: activeIdx,
    })
  }, [activeIdx, hOpts, hitIdPrefix, q, scope])

  if (!hasContent) return null

  return (
    <div className={cn('prose prose-xuantian max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={highlight ? [highlight] : []}
        components={buildComponents({ idPrefix })}
      >
        {md}
      </ReactMarkdown>
    </div>
  )
})

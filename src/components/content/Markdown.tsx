import ReactMarkdown, { type Components } from 'react-markdown'
import { isValidElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { cn } from '../../lib/cn'

type MarkdownProps = {
  text: string
  className?: string
  /** 将“【标题】”行转换为 Markdown 标题，便于经卷观排版。 */
  bracketHeadings?: boolean
  /** 将“定位：/path?query”转换为可点击链接。 */
  linkifyLocations?: boolean
  /** 生成标题定位 ID 的前缀；用于避免同页多份经卷时出现重复 ID。 */
  idPrefix?: string
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
    h1: makeHeading('h1'),
    h2: makeHeading('h2'),
    h3: makeHeading('h3'),
    h4: makeHeading('h4'),
    h5: makeHeading('h5'),
    h6: makeHeading('h6'),
  }
}

export function Markdown({ text, className, bracketHeadings = true, linkifyLocations = true, idPrefix = '' }: MarkdownProps) {
  const md = normalizeXuantianMarkdown(text, { bracketHeadings, linkifyLocations })
  if (!md.trim()) return null

  return (
    <div className={cn('prose prose-xuantian max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={buildComponents({ idPrefix })}>
        {md}
      </ReactMarkdown>
    </div>
  )
}

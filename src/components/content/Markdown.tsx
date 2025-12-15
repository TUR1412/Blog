import ReactMarkdown, { type Components } from 'react-markdown'
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
}

function normalizeXuantianMarkdown(
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

const components: Components = {
  a({ href, children }) {
    const h = typeof href === 'string' ? href : ''
    const isInternal = h.startsWith('/') && !h.startsWith('//')
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
  },
  code({ className, children, ...props }) {
    return (
      <code className={cn('font-medium', className)} {...props}>
        {children}
      </code>
    )
  },
}

export function Markdown({ text, className, bracketHeadings = true, linkifyLocations = true }: MarkdownProps) {
  const md = normalizeXuantianMarkdown(text, { bracketHeadings, linkifyLocations })
  if (!md.trim()) return null

  return (
    <div className={cn('prose prose-xuantian max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
        {md}
      </ReactMarkdown>
    </div>
  )
}

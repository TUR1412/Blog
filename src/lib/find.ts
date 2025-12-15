export type FindOptions = {
  /** 是否区分大小写；默认 false（不区分）。 */
  matchCase: boolean
  /** 是否整词匹配；仅对纯字母/数字/下划线有效。 */
  wholeWord: boolean
  /** 忽略标点/空白：允许在匹配字符间跨过标点与空格。 */
  ignorePunctuation: boolean
}

export const DEFAULT_FIND_OPTIONS: FindOptions = {
  matchCase: false,
  wholeWord: false,
  ignorePunctuation: false,
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildFindRegExp(queryRaw: string, opts?: Partial<FindOptions>): RegExp | null {
  const q = queryRaw.trim()
  if (!q) return null

  const matchCase = opts?.matchCase ?? DEFAULT_FIND_OPTIONS.matchCase
  const wholeWord = opts?.wholeWord ?? DEFAULT_FIND_OPTIONS.wholeWord
  const ignorePunctuation = opts?.ignorePunctuation ?? DEFAULT_FIND_OPTIONS.ignorePunctuation

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

export function findAllMatchRanges(
  text: string,
  queryRaw: string,
  opts?: Partial<FindOptions>,
  limit = 600,
): { start: number; end: number }[] {
  const src = typeof text === 'string' ? text : ''
  if (!src) return []
  const re = buildFindRegExp(queryRaw, opts)
  if (!re) return []

  const out: { start: number; end: number }[] = []
  re.lastIndex = 0

  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const start = m.index ?? 0
    const s = typeof m[0] === 'string' ? m[0] : ''
    const end = start + s.length

    if (end <= start) {
      re.lastIndex = Math.min(src.length, start + 1)
      continue
    }

    out.push({ start, end })
    if (out.length >= limit) break
  }

  return out
}


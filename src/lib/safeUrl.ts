export type SafeLink =
  | { kind: 'hash'; href: string }
  | { kind: 'internal'; href: string }
  | { kind: 'external'; href: string; targetBlank: boolean }

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

function normalizeProtocolRelative(href: string) {
  if (!href.startsWith('//')) return href
  return `https:${href}`
}

export function parseSafeLink(rawHref: string): SafeLink | null {
  const href = (rawHref ?? '').trim()
  if (!href) return null

  if (href.startsWith('#')) return { kind: 'hash', href }
  if (href.startsWith('/') && !href.startsWith('//')) return { kind: 'internal', href }

  const normalized = normalizeProtocolRelative(href)

  let url: URL
  try {
    url = new URL(normalized)
  } catch {
    return null
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) return null

  const targetBlank = url.protocol === 'http:' || url.protocol === 'https:'
  return { kind: 'external', href: url.toString(), targetBlank }
}


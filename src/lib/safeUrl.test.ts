import { describe, expect, it } from 'vitest'

import { parseSafeLink } from './safeUrl'

describe('parseSafeLink', () => {
  it('returns null for empty input', () => {
    expect(parseSafeLink('')).toBeNull()
    expect(parseSafeLink('   ')).toBeNull()
  })

  it('parses hash links', () => {
    expect(parseSafeLink('#section')).toEqual({ kind: 'hash', href: '#section' })
  })

  it('parses internal links', () => {
    expect(parseSafeLink('/notes')).toEqual({ kind: 'internal', href: '/notes' })
  })

  it('normalizes protocol-relative links to https', () => {
    const link = parseSafeLink('//example.com/path')
    expect(link).toEqual({ kind: 'external', href: 'https://example.com/path', targetBlank: true })
  })

  it('parses allowed external protocols', () => {
    expect(parseSafeLink('https://example.com')).toEqual({
      kind: 'external',
      href: 'https://example.com/',
      targetBlank: true,
    })

    expect(parseSafeLink('mailto:test@example.com')).toEqual({
      kind: 'external',
      href: 'mailto:test@example.com',
      targetBlank: false,
    })

    expect(parseSafeLink('tel:+123456789')).toEqual({
      kind: 'external',
      href: 'tel:+123456789',
      targetBlank: false,
    })
  })

  it('rejects disallowed protocols', () => {
    expect(parseSafeLink('javascript:alert(1)')).toBeNull()
    expect(parseSafeLink('data:text/plain,hello')).toBeNull()
    expect(parseSafeLink('file:///etc/passwd')).toBeNull()
  })

  it('rejects invalid URLs', () => {
    expect(parseSafeLink('not a url')).toBeNull()
    expect(parseSafeLink('http:')).toBeNull()
  })
})


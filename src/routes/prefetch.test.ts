import { describe, expect, it } from 'vitest'
import { getCorePrefetchTargets, normalizePath, safeKey, shouldPrefetchMarkdownForPath } from './prefetch'

describe('routes/prefetch', () => {
  it('normalizePath strips hash/query and trims', () => {
    expect(normalizePath(' /notes?view=edit#anything ')).toBe('/notes')
    expect(normalizePath('/chronicles/slug-1?x=1')).toBe('/chronicles/slug-1')
    expect(normalizePath('   ')).toBe('/')
  })

  it('safeKey normalizes empty to root', () => {
    expect(safeKey('')).toBe('/')
    expect(safeKey('   ')).toBe('/')
    expect(safeKey('/notes')).toBe('/notes')
  })

  it('shouldPrefetchMarkdownForPath selects markdown-heavy routes', () => {
    expect(shouldPrefetchMarkdownForPath('/notes')).toBe(true)
    expect(shouldPrefetchMarkdownForPath('/relations')).toBe(true)
    expect(shouldPrefetchMarkdownForPath('/chronicles')).toBe(false)
  })

  it('getCorePrefetchTargets respects includeNotes and priority', () => {
    expect(getCorePrefetchTargets()).toEqual([
      '/chronicles',
      '/about',
      '/grotto',
      '/relations',
      '/annotations',
      '/treasury',
    ])

    expect(getCorePrefetchTargets({ includeNotes: true })).toEqual([
      '/chronicles',
      '/about',
      '/grotto',
      '/relations',
      '/annotations',
      '/treasury',
      '/notes',
    ])

    expect(getCorePrefetchTargets({ priority: 'light' })).toEqual(['/chronicles', '/about'])
    expect(getCorePrefetchTargets({ priority: 'light', includeNotes: true })).toEqual([
      '/chronicles',
      '/about',
    ])
  })
})


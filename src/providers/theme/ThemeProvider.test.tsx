import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { STORAGE_KEYS } from '../../lib/constants'
import { ThemeProvider, useTheme } from './ThemeProvider'

function ThemeProbe() {
  const { theme, effectiveTheme, cycleTheme, setTheme } = useTheme()
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="effective">{effectiveTheme}</div>
      <button type="button" onClick={() => cycleTheme()}>
        cycle
      </button>
      <button type="button" onClick={() => setTheme('system')}>
        system
      </button>
      <button type="button" onClick={() => setTheme('dark')}>
        dark
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        light
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  it('reads initial theme from storage and applies data-theme', async () => {
    window.localStorage.setItem(STORAGE_KEYS.theme, 'dark')

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(window.localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark')
  })

  it('cycles theme system -> dark -> light -> system', async () => {
    window.localStorage.setItem(STORAGE_KEYS.theme, 'system')
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('theme').textContent).toBe('system')
    })
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'cycle' }))
    await waitFor(() => expect(screen.getByTestId('theme').textContent).toBe('dark'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'cycle' }))
    await waitFor(() => expect(screen.getByTestId('theme').textContent).toBe('light'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: 'cycle' }))
    await waitFor(() => expect(screen.getByTestId('theme').textContent).toBe('system'))
    expect(document.documentElement.getAttribute('data-theme')).toBeNull()
  })
})

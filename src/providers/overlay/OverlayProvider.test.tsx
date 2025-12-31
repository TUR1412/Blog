import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { OverlayProvider, useOverlay } from './OverlayProvider'

function OverlayProbe() {
  const { toast, confirm } = useOverlay()
  const [confirmResult, setConfirmResult] = React.useState<string>('idle')
  const [queueResult, setQueueResult] = React.useState<string>('idle')

  return (
    <div>
      <button
        type="button"
        onClick={() => toast({ title: 'Toast', message: 'Hello Toast', durationMs: 10_000 })}
      >
        toast
      </button>
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({
            title: 'Confirm Title',
            message: 'Confirm message',
            confirmText: 'YES',
            cancelText: 'NO',
          })
          setConfirmResult(ok ? 'yes' : 'no')
        }}
      >
        confirm
      </button>
      <button
        type="button"
        onClick={async () => {
          const p1 = confirm({
            title: 'Queue #1',
            message: 'First',
            confirmText: 'ONE',
            cancelText: 'CANCEL',
          })
          const p2 = confirm({
            title: 'Queue #2',
            message: 'Second',
            confirmText: 'TWO',
            cancelText: 'CANCEL',
          })
          const r1 = await p1
          const r2 = await p2
          setQueueResult(`${String(r1)}-${String(r2)}`)
        }}
      >
        queue
      </button>
      <div data-testid="confirm-result">{confirmResult}</div>
      <div data-testid="queue-result">{queueResult}</div>
    </div>
  )
}

describe('OverlayProvider', () => {
  it('shows a toast and can dismiss it', async () => {
    const user = userEvent.setup()
    render(
      <OverlayProvider>
        <OverlayProbe />
      </OverlayProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'toast' }))
    expect(screen.getByText('Hello Toast')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关闭提示' }))
    await waitFor(() => expect(screen.queryByText('Hello Toast')).not.toBeInTheDocument())
  })

  it('resolves confirm(true) when clicking confirm button', async () => {
    const user = userEvent.setup()
    render(
      <OverlayProvider>
        <OverlayProbe />
      </OverlayProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'confirm' }))
    expect(screen.getByRole('dialog', { name: 'Confirm Title' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'YES' }))
    await waitFor(() => expect(screen.getByTestId('confirm-result').textContent).toBe('yes'))
  })

  it('resolves confirm(false) when pressing Escape', async () => {
    const user = userEvent.setup()
    render(
      <OverlayProvider>
        <OverlayProbe />
      </OverlayProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'confirm' }))
    expect(screen.getByRole('dialog', { name: 'Confirm Title' })).toBeInTheDocument()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await waitFor(() => expect(screen.getByTestId('confirm-result').textContent).toBe('no'))
  })

  it('queues confirm requests and resolves in order', async () => {
    const user = userEvent.setup()
    render(
      <OverlayProvider>
        <OverlayProbe />
      </OverlayProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'queue' }))

    expect(screen.getByRole('dialog', { name: 'Queue #1' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ONE' }))

    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Queue #2' })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'TWO' }))

    await waitFor(() => expect(screen.getByTestId('queue-result').textContent).toBe('true-true'))
  })
})


const FOCUSABLE_SELECTOR =
  'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'

function isElementVisible(el: HTMLElement) {
  // getClientRects() 比 offsetParent 更可靠：position: fixed 时 offsetParent 也可能为 null。
  return el.getClientRects().length > 0
}

export function getFocusableElements(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.hasAttribute('disabled')) return false
    if (el.getAttribute('aria-disabled') === 'true') return false
    if (el.tabIndex < 0) return false
    if (!isElementVisible(el)) return false
    return true
  })
}

export function trapFocusOnTab(e: KeyboardEvent, root: HTMLElement) {
  if (e.key !== 'Tab') return
  const nodes = getFocusableElements(root)
  if (nodes.length === 0) return

  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  const active = document.activeElement as HTMLElement | null
  const activeInside = active ? root.contains(active) : false

  if (!activeInside) {
    e.preventDefault()
    ;(e.shiftKey ? last : first).focus()
    return
  }

  if (nodes.length === 1) {
    e.preventDefault()
    first.focus()
    return
  }

  if (e.shiftKey) {
    if (!active || active === first) {
      e.preventDefault()
      last.focus()
    }
    return
  }

  if (active === last) {
    e.preventDefault()
    first.focus()
  }
}


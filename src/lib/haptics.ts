import { canUseDOM } from './storage'

type VibrateNavigator = Navigator & {
  vibrate?: (pattern: number | number[]) => boolean
}

export function tryVibrate(pattern: number | number[]) {
  if (!canUseDOM()) return false
  const nav = navigator as VibrateNavigator
  if (typeof nav.vibrate !== 'function') return false
  try {
    return Boolean(nav.vibrate(pattern))
  } catch {
    return false
  }
}

export function hapticTap() {
  tryVibrate(10)
}

export function hapticSuccess() {
  tryVibrate([10, 26, 14])
}


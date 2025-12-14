export function canUseDOM() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

export function readString(key: string, fallback: string) {
  if (!canUseDOM()) return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

export function writeString(key: string, value: string) {
  if (!canUseDOM()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // 忽略：隐私模式/配额等场景
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key, '')
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJson<T>(key: string, value: T) {
  writeString(key, JSON.stringify(value))
}


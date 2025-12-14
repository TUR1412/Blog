import { useEffect, useState } from 'react'
import { canUseDOM, readJson, writeJson } from '../lib/storage'

export function useLocalStorageState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (!canUseDOM()) return initial
    return readJson<T>(key, initial)
  })

  useEffect(() => {
    writeJson(key, value)
  }, [key, value])

  return [value, setValue] as const
}


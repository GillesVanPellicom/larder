import { useCallback, useState } from 'react'

const STORAGE_KEY = 'larder:sticky-sub-header'

export function useSubHeader(initialEnabled = true) {
  const [subHeaderEnabled, setSubHeaderEnabledState] = useState<boolean>(initialEnabled)

  const setSubHeaderEnabled = useCallback((enabled: boolean) => {
    setSubHeaderEnabledState(enabled)
    try {
      localStorage.setItem(STORAGE_KEY, String(enabled))
    } catch {
      // ignore
    }
  }, [])

  const toggleSubHeader = useCallback(() => {
    setSubHeaderEnabledState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return {
    subHeaderEnabled,
    setSubHeaderEnabled,
    toggleSubHeader,
  }
}

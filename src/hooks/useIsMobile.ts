import { useState, useEffect } from 'react'

/**
 * Best-guess detection of whether the current device is a tablet or smartphone.
 * Checks user agent, iPadOS desktop-mode user agent, coarse pointer, touch points,
 * and responsive fallbacks.
 */
function getIsMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }

  // 1. User Agent regex for smartphones and tablets
  const ua = navigator.userAgent || ''
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)
  if (isMobileUA) {
    return true
  }

  // 2. iPadOS Safari detection (reports MacIntel, but has multi-touch)
  const isIPad = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1
  if (isIPad) {
    return true
  }

  // 3. Media query checks for touch-primary / coarse pointer devices
  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const hasNoHover = window.matchMedia?.('(hover: none)').matches ?? false
  const hasTouchPoints = (navigator.maxTouchPoints || 0) > 0

  if (hasCoarsePointer && (hasNoHover || hasTouchPoints)) {
    return true
  }

  return false
}

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => getIsMobileDevice())

  useEffect(() => {
    const handleUpdate = () => {
      setIsMobile(getIsMobileDevice())
    }

    const coarseQuery = window.matchMedia?.('(pointer: coarse)')
    const hoverQuery = window.matchMedia?.('(hover: none)')

    coarseQuery?.addEventListener?.('change', handleUpdate)
    hoverQuery?.addEventListener?.('change', handleUpdate)
    window.addEventListener('resize', handleUpdate)
    window.addEventListener('orientationchange', handleUpdate)

    return () => {
      coarseQuery?.removeEventListener?.('change', handleUpdate)
      hoverQuery?.removeEventListener?.('change', handleUpdate)
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('orientationchange', handleUpdate)
    }
  }, [])

  return isMobile
}

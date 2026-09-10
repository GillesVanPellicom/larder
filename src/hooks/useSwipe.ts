import { useRef } from 'react'

export interface SwipeOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  minDistance?: number
  maxDistanceYRatio?: number
  maxTime?: number
  enabled?: boolean
}

/**
 * Hook to handle touch swipe gestures (e.g. pagination or tab navigation on mobile).
 * Configured with moderate distance and angle thresholds to prevent accidental triggering
 * during vertical scrolling.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 75,
  maxDistanceYRatio = 0.65,
  maxTime = 600,
  enabled = true,
}: SwipeOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled || e.touches.length !== 1) return
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!enabled || !touchStartRef.current || e.changedTouches.length !== 1) {
      touchStartRef.current = null
      return
    }

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    touchStartRef.current = null

    // Ignore swipes that took too long (e.g. hold and drag or slow scroll)
    if (deltaTime > maxTime) return

    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Ensure horizontal distance exceeds threshold and is predominantly horizontal
    if (absX >= minDistance && absY <= absX * maxDistanceYRatio) {
      if (deltaX < 0) {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
    }
  }

  return {
    onTouchStart,
    onTouchEnd,
  }
}

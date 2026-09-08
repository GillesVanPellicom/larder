export function isMac(): boolean {
  if (typeof window === 'undefined') return false
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent)
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function getModifierKey(): string {
  return isMac() ? 'Cmd' : 'Ctrl'
}

/**
 * Returns shortcut string like " (Cmd+N)" or " (Ctrl+N)", or "" if on touch/mobile.
 */
export function getShortcutLabel(key: string): string {
  if (isTouchDevice()) return ''
  const mod = getModifierKey()
  return ` (${mod}+${key.toUpperCase()})`
}

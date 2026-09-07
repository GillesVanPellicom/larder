import { useEffect } from 'react'

interface KeyboardShortcutOptions {
  onOpenFilters: () => void
  onToggleFilters: () => void
  onNewRecipe: () => void
}

export function useAppKeyboardShortcuts({
  onOpenFilters,
  onToggleFilters,
  onNewRecipe,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenFilters()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        onToggleFilters()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        onNewRecipe()
        return
      }

      if (!isInput) {
        if (e.key === 'n') {
          e.preventDefault()
          onNewRecipe()
        } else if (e.key === 'f') {
          e.preventDefault()
          onOpenFilters()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenFilters, onToggleFilters, onNewRecipe])
}

import { useEffect } from 'react'

interface KeyboardShortcutOptions {
  onToggleFilters: () => void
  onNewRecipe: () => void
}

export function useAppKeyboardShortcuts({
  onToggleFilters,
  onNewRecipe,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.metaKey || e.ctrlKey

      if (isModifier && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        onToggleFilters()
        return
      }

      if (isModifier && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        onNewRecipe()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onToggleFilters, onNewRecipe])
}

import { useCallback, useRef, useState } from 'react'
import type { PageView, Recipe } from '@/shared/types'

export interface HistoryEntry {
  view: PageView
  recipe: Recipe | null
  scrollY: number
}

export function useNavigation() {
  const [currentView, setCurrentView] = useState<PageView>('recipes')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const recipesScrollYRef = useRef<number>(0)

  const navigateTo = useCallback(
    (
      view: PageView,
      recipe: Recipe | null = null
    ) => {
      if (currentView === 'recipes') {
        recipesScrollYRef.current = window.scrollY
      }

      setHistory((prev) => [
        ...prev,
        {
          view: currentView,
          recipe: selectedRecipe,
          scrollY: window.scrollY,
        },
      ])

      setSelectedRecipe(recipe)
      setCurrentView(view)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    },
    [currentView, selectedRecipe]
  )

  const updateRecipe = useCallback((updated: Recipe) => {
    setSelectedRecipe((prev) => (prev?.id === updated.id ? updated : prev))
    setHistory((prev) =>
      prev.map((entry) => {
        if (entry.recipe && entry.recipe.id === updated.id) {
          return { ...entry, recipe: updated }
        }
        return entry
      })
    )
  }, [])

  const handleBack = useCallback(() => {
    if (history.length > 0) {
      const previous = history[history.length - 1]
      setHistory((prev) => prev.slice(0, -1))
      setCurrentView(previous.view)

      // If the recipe in the previous view is the same one that was edited, keep the fresh instance
      if (previous.recipe && selectedRecipe && previous.recipe.id === selectedRecipe.id) {
        setSelectedRecipe(selectedRecipe)
      } else {
        setSelectedRecipe(previous.recipe)
      }

      const targetScroll =
        previous.view === 'recipes'
          ? (previous.scrollY ?? recipesScrollYRef.current)
          : previous.scrollY

      setTimeout(() => {
        window.scrollTo({ top: targetScroll, behavior: 'instant' as ScrollBehavior })
      }, 10)
    } else {
      setCurrentView('recipes')
      setSelectedRecipe(null)
      setTimeout(() => {
        window.scrollTo({ top: recipesScrollYRef.current, behavior: 'instant' as ScrollBehavior })
      }, 10)
    }
  }, [history, selectedRecipe])

  const handleNavTab = useCallback(
    (view: PageView) => {
      if (currentView === view && (view !== 'recipes' || !selectedRecipe)) {
        return
      }

      if (currentView === 'recipes') {
        recipesScrollYRef.current = window.scrollY
      }

      setHistory([])
      setSelectedRecipe(null)
      setCurrentView(view)

      if (view === 'recipes') {
        setTimeout(() => {
          window.scrollTo({ top: recipesScrollYRef.current, behavior: 'instant' as ScrollBehavior })
        }, 10)
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
      }
    },
    [currentView, selectedRecipe]
  )

  const handleSavedTransition = useCallback((saved: Recipe) => {
    setSelectedRecipe(saved)
    setCurrentView('recipe-view')
    setHistory((prev) => {
      const next = prev.filter((entry) => entry.view !== 'recipe-form')
      if (next.length === 0) {
        return [{ view: 'recipes', recipe: null, scrollY: recipesScrollYRef.current }]
      }
      return next
    })
  }, [])

  const handleDeletedTransition = useCallback(() => {
    setSelectedRecipe(null)
    setCurrentView('recipes')
    setHistory([])
    setTimeout(() => {
      window.scrollTo({ top: recipesScrollYRef.current, behavior: 'instant' as ScrollBehavior })
    }, 10)
  }, [])

  return {
    currentView,
    selectedRecipe,
    setSelectedRecipe,
    updateRecipe,
    navigateTo,
    handleBack,
    handleNavTab,
    handleSavedTransition,
    handleDeletedTransition,
  }
}

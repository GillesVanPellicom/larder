import { useCallback, useRef, useState } from 'react'
import type { Recipe, RecipeTemplate } from '@/shared/types'

export type PageView =
  | 'recipes'
  | 'recipe-view'
  | 'recipe-form'
  | 'settings'

export interface HistoryEntry {
  view: PageView
  recipe: Recipe | null
  template?: RecipeTemplate | null
  scrollY: number
}

export function useNavigation() {
  const [currentView, setCurrentView] = useState<PageView>('recipes')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<RecipeTemplate | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const recipesScrollYRef = useRef<number>(0)

  const navigateTo = useCallback(
    (
      view: PageView,
      recipe: Recipe | null = null,
      template: RecipeTemplate | null = null
    ) => {
      if (currentView === 'recipes') {
        recipesScrollYRef.current = window.scrollY
      }

      setHistory((prev) => [
        ...prev,
        {
          view: currentView,
          recipe: selectedRecipe,
          template: selectedTemplate,
          scrollY: window.scrollY,
        },
      ])

      setSelectedRecipe(recipe)
      setSelectedTemplate(template)
      setCurrentView(view)
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    },
    [currentView, selectedRecipe, selectedTemplate]
  )

  const handleBack = useCallback(() => {
    if (history.length > 0) {
      const previous = history[history.length - 1]
      setHistory((prev) => prev.slice(0, -1))
      setCurrentView(previous.view)
      setSelectedRecipe(previous.recipe)
      setSelectedTemplate(previous.template || null)

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
      setSelectedTemplate(null)
      setTimeout(() => {
        window.scrollTo({ top: recipesScrollYRef.current, behavior: 'instant' as ScrollBehavior })
      }, 10)
    }
  }, [history])

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
      setSelectedTemplate(null)
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
    setSelectedTemplate(null)
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
    selectedTemplate,
    setSelectedTemplate,
    navigateTo,
    handleBack,
    handleNavTab,
    handleSavedTransition,
    handleDeletedTransition,
  }
}

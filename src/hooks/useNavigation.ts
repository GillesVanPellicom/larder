import { useCallback, useEffect, useRef, useState } from 'react'
import type { PageView, Recipe, SettingsTabId, ShoppingListTabId } from '@/shared/types'

export interface HistoryEntry {
  view: PageView
  recipe: Recipe | null
  settingsTab: SettingsTabId
  shoppingListTab: ShoppingListTabId
  scrollY: number
}

export function useNavigation() {
  const [currentView, setCurrentView] = useState<PageView>('recipes')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('info')
  const [shoppingListTab, setShoppingListTab] = useState<ShoppingListTabId>('per_recipe')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const recipesScrollYRef = useRef<number>(0)
  const isPoppingRef = useRef<boolean>(false)

  const navigateTo = useCallback(
    (
      view: PageView,
      recipe: Recipe | null = null,
      options?: {
        settingsTab?: SettingsTabId
        shoppingListTab?: ShoppingListTabId
      }
    ) => {
      const nextSettingsTab = options?.settingsTab ?? settingsTab
      const nextShoppingListTab = options?.shoppingListTab ?? shoppingListTab

      // Skip duplicate navigation if already on identical view and tab
      if (
        currentView === view &&
        selectedRecipe?.id === recipe?.id &&
        settingsTab === nextSettingsTab &&
        shoppingListTab === nextShoppingListTab
      ) {
        return
      }

      if (currentView === 'recipes') {
        recipesScrollYRef.current = window.scrollY
      }

      setHistory((prev) => [
        ...prev,
        {
          view: currentView,
          recipe: selectedRecipe,
          settingsTab,
          shoppingListTab,
          scrollY: window.scrollY,
        },
      ])

      setSelectedRecipe(recipe)
      setCurrentView(view)
      if (options?.settingsTab) setSettingsTab(options.settingsTab)
      if (options?.shoppingListTab) setShoppingListTab(options.shoppingListTab)

      try {
        window.history.pushState({ appNav: true }, '')
      } catch {
        // Safe fallback in restricted environments
      }

      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    },
    [currentView, selectedRecipe, settingsTab, shoppingListTab]
  )

  const navigateToSettingsTab = useCallback(
    (tab: SettingsTabId) => {
      if (currentView === 'settings' && settingsTab === tab) {
        return
      }

      if (currentView === 'recipes') {
        recipesScrollYRef.current = window.scrollY
      }

      setHistory((prev) => [
        ...prev,
        {
          view: currentView,
          recipe: selectedRecipe,
          settingsTab,
          shoppingListTab,
          scrollY: window.scrollY,
        },
      ])

      setSettingsTab(tab)
      setCurrentView('settings')
      setSelectedRecipe(null)

      try {
        window.history.pushState({ appNav: true }, '')
      } catch {
        // Safe fallback
      }
    },
    [currentView, selectedRecipe, settingsTab, shoppingListTab]
  )

  const navigateToShoppingListTab = useCallback(
    (tab: ShoppingListTabId) => {
      if (currentView === 'shopping-list' && shoppingListTab === tab) {
        return
      }

      if (currentView === 'recipes') {
        recipesScrollYRef.current = window.scrollY
      }

      setHistory((prev) => [
        ...prev,
        {
          view: currentView,
          recipe: selectedRecipe,
          settingsTab,
          shoppingListTab,
          scrollY: window.scrollY,
        },
      ])

      setShoppingListTab(tab)
      setCurrentView('shopping-list')
      setSelectedRecipe(null)

      try {
        window.history.pushState({ appNav: true }, '')
      } catch {
        // Safe fallback
      }
    },
    [currentView, selectedRecipe, settingsTab, shoppingListTab]
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
      setSettingsTab(previous.settingsTab)
      setShoppingListTab(previous.shoppingListTab)

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
      navigateTo(view, null)
    },
    [navigateTo]
  )

  const handleSavedTransition = useCallback((saved: Recipe) => {
    setSelectedRecipe(saved)
    setCurrentView('recipe-view')
    setHistory((prev) => {
      const next = prev.filter((entry) => entry.view !== 'recipe-form')
      if (next.length === 0) {
        return [
          {
            view: 'recipes',
            recipe: null,
            settingsTab: 'info',
            shoppingListTab: 'per_recipe',
            scrollY: recipesScrollYRef.current,
          },
        ]
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

  // Sync browser back navigation (popstate) with in-app backstack
  useEffect(() => {
    const handlePopState = () => {
      if (isPoppingRef.current) return
      isPoppingRef.current = true
      handleBack()
      setTimeout(() => {
        isPoppingRef.current = false
      }, 50)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [handleBack])

  return {
    currentView,
    selectedRecipe,
    settingsTab,
    shoppingListTab,
    setSelectedRecipe,
    setSettingsTab,
    setShoppingListTab,
    updateRecipe,
    navigateTo,
    navigateToSettingsTab,
    navigateToShoppingListTab,
    handleBack,
    handleNavTab,
    handleSavedTransition,
    handleDeletedTransition,
  }
}

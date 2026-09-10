import { useState, useEffect, useCallback, useMemo } from 'react'
import { shoppingListApi } from '@/services/api'
import { consolidateShoppingList } from '@/lib/shoppingListConsolidator'
import type { ShoppingListHistoryItem, ShoppingListItem } from '@/shared/types'

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [history, setHistory] = useState<ShoppingListHistoryItem[]>([])
  const [storeAssignments, setStoreAssignments] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  const fetchShoppingList = useCallback(async () => {
    try {
      setLoading(true)
      const data = await shoppingListApi.get()
      setItems(data.items || [])
      setHistory(data.history || [])
      setStoreAssignments(data.storeAssignments || {})
    } catch (err) {
      console.error('[useShoppingList] Failed to fetch shopping list:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchShoppingList()
  }, [fetchShoppingList])

  const { consolidated, uniqueCount } = useMemo(() => {
    return consolidateShoppingList(items)
  }, [items])

  const isRecipeInShoppingList = useCallback(
    (recipeId: number): boolean => {
      return items.some((item) => item.recipe_id === recipeId)
    },
    [items]
  )

  const getRecipeCheckedIngredients = useCallback(
    (recipeId: number): string[] => {
      const found = items.find((item) => item.recipe_id === recipeId)
      return found?.checked_ingredients || []
    },
    [items]
  )

  const getRecipeMultiplier = useCallback(
    (recipeId: number): number => {
      const found = items.find((item) => item.recipe_id === recipeId)
      return found?.multiplier || 1
    },
    [items]
  )

  const addToShoppingList = useCallback(
    async (recipeId: number, checkedIngredients?: string[], multiplier?: number) => {
      try {
        const updated = await shoppingListApi.add(recipeId, checkedIngredients, multiplier)
        setItems((prev) => {
          const index = prev.findIndex((item) => item.recipe_id === recipeId)
          if (index >= 0) {
            const next = [...prev]
            next[index] = updated
            return next
          }
          return [...prev, updated]
        })
      } catch (err) {
        console.error('[useShoppingList] Failed to add recipe to shopping list:', err)
        throw err
      }
    },
    []
  )

  const removeFromShoppingList = useCallback(async (recipeId: number) => {
    try {
      await shoppingListApi.remove(recipeId)
      setItems((prev) => prev.filter((item) => item.recipe_id !== recipeId))
    } catch (err) {
      console.error('[useShoppingList] Failed to remove recipe from shopping list:', err)
      throw err
    }
  }, [])

  const toggleRecipeInShoppingList = useCallback(
    async (recipeId: number, checkedIngredients?: string[], multiplier?: number) => {
      if (isRecipeInShoppingList(recipeId)) {
        await removeFromShoppingList(recipeId)
      } else {
        await addToShoppingList(recipeId, checkedIngredients, multiplier)
      }
    },
    [isRecipeInShoppingList, removeFromShoppingList, addToShoppingList]
  )

  const updateRecipeMultiplier = useCallback(
    async (recipeId: number, multiplier: number) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.recipe_id === recipeId ? { ...item, multiplier } : item
        )
      )
      try {
        await shoppingListApi.updateMultiplier(recipeId, multiplier)
      } catch (err) {
        console.error('[useShoppingList] Failed to update multiplier:', err)
        void fetchShoppingList()
      }
    },
    [fetchShoppingList]
  )

  const updateRecipeChecked = useCallback(
    async (recipeId: number, nextChecked: string[]) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.recipe_id === recipeId ? { ...item, checked_ingredients: nextChecked } : item
        )
      )
      try {
        await shoppingListApi.updateChecked(recipeId, nextChecked)
      } catch (err) {
        console.error('[useShoppingList] Failed to update checked ingredients:', err)
        void fetchShoppingList()
      }
    },
    [fetchShoppingList]
  )

  const toggleIngredientInRecipe = useCallback(
    async (recipeId: number, itemKey: string) => {
      const currentItem = items.find((i) => i.recipe_id === recipeId)
      if (!currentItem) return

      const currentChecked = currentItem.checked_ingredients || []
      const nextChecked = currentChecked.includes(itemKey)
        ? currentChecked.filter((k) => k !== itemKey)
        : [...currentChecked, itemKey]

      await updateRecipeChecked(recipeId, nextChecked)
    },
    [items, updateRecipeChecked]
  )

  const toggleConsolidatedIngredient = useCallback(
    async (ingredientName: string) => {
      const normName = ingredientName.toLowerCase()
      const targetGroup = consolidated.find((c) => c.name.toLowerCase() === normName)
      if (!targetGroup) return

      // If currently all checked -> uncheck all; otherwise -> check all
      const willBeChecked = !targetGroup.isChecked

      // Group instances by recipeId
      const byRecipe = new Map<number, { itemKey: string; setChecked: boolean }[]>()
      for (const inst of targetGroup.instances) {
        if (!byRecipe.has(inst.recipeId)) {
          byRecipe.set(inst.recipeId, [])
        }
        byRecipe.get(inst.recipeId)!.push({
          itemKey: inst.itemKey,
          setChecked: willBeChecked,
        })
      }

      // Update each recipe's checked ingredients concurrently
      const updatePromises = Array.from(byRecipe.entries()).map(async ([recipeId, changes]) => {
        const item = items.find((i) => i.recipe_id === recipeId)
        if (!item) return

        let currentChecked = [...(item.checked_ingredients || [])]
        for (const change of changes) {
          if (change.setChecked) {
            if (!currentChecked.includes(change.itemKey)) {
              currentChecked.push(change.itemKey)
            }
          } else {
            currentChecked = currentChecked.filter((k) => k !== change.itemKey)
          }
        }

        await updateRecipeChecked(recipeId, currentChecked)
      })

      await Promise.all(updatePromises)
    },
    [consolidated, items, updateRecipeChecked]
  )

  const updateStoreAssignments = useCallback(
    async (
      nextOrUpdater:
        | Record<string, string[]>
        | ((prev: Record<string, string[]>) => Record<string, string[]>)
    ) => {
      setStoreAssignments((prev) => {
        const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater
        void shoppingListApi.updateStoreAssignments(next).catch((err) => {
          console.error('[useShoppingList] Failed to sync store assignments:', err)
        })
        return next
      })
    },
    []
  )

  const clearShoppingList = useCallback(async () => {
    try {
      await shoppingListApi.clear()
      setStoreAssignments({})
      await fetchShoppingList()
    } catch (err) {
      console.error('[useShoppingList] Failed to clear shopping list:', err)
      throw err
    }
  }, [fetchShoppingList])

  const loadHistorySnapshot = useCallback(
    async (historyId: number) => {
      try {
        await shoppingListApi.loadHistory(historyId)
        await fetchShoppingList()
      } catch (err) {
        console.error('[useShoppingList] Failed to load history snapshot:', err)
        throw err
      }
    },
    [fetchShoppingList]
  )

  const deleteHistorySnapshot = useCallback(async (historyId: number) => {
    try {
      await shoppingListApi.deleteHistory(historyId)
      setHistory((prev) => prev.filter((h) => h.id !== historyId))
    } catch (err) {
      console.error('[useShoppingList] Failed to delete history item:', err)
      throw err
    }
  }, [])

  return {
    items,
    history,
    storeAssignments,
    loading,
    consolidated,
    uniqueIngredientsCount: uniqueCount,
    isRecipeInShoppingList,
    getRecipeCheckedIngredients,
    getRecipeMultiplier,
    addToShoppingList,
    removeFromShoppingList,
    toggleRecipeInShoppingList,
    updateRecipeChecked,
    updateRecipeMultiplier,
    updateStoreAssignments,
    toggleIngredientInRecipe,
    toggleConsolidatedIngredient,
    clearShoppingList,
    loadHistorySnapshot,
    deleteHistorySnapshot,
    refresh: fetchShoppingList,
  }
}

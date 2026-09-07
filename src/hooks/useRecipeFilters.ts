import { useCallback, useMemo, useState } from 'react'
import type { FilterCriteria, Recipe, RecipeConflict } from '@/shared/types'
import {
  DEFAULT_FILTER_CRITERIA,
  countActiveFilters,
  extractAllIngredients,
  filterRecipes,
} from '@/lib/recipeFilters'

export function useRecipeFilters(
  recipes: Recipe[],
  violationsMap: Map<number, RecipeConflict['violations']>
) {
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>(DEFAULT_FILTER_CRITERIA)

  const resetFilters = useCallback(() => {
    setFilterCriteria(DEFAULT_FILTER_CRITERIA)
  }, [])

  const allIngredients = useMemo(() => {
    return extractAllIngredients(recipes)
  }, [recipes])

  const filteredRecipes = useMemo(() => {
    return filterRecipes(recipes, filterCriteria, violationsMap)
  }, [recipes, filterCriteria, violationsMap])

  const activeFiltersCount = useMemo(() => {
    return countActiveFilters(filterCriteria)
  }, [filterCriteria])

  return {
    filterCriteria,
    setFilterCriteria,
    resetFilters,
    allIngredients,
    filteredRecipes,
    activeFiltersCount,
  }
}

import type { FilterCriteria, Recipe, RecipeConflict } from '@/shared/types'

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  searchQuery: '',
  matchModePerElement: {
    ingredients: 'any',
    tags: 'all',
    categoryTags: {},
  },
  selectedIngredients: [],
  selectedTags: {},
  maxTotalTime: undefined,
  maxPrepTime: undefined,
  maxCookTime: undefined,
  hasImage: null,
  onlyConflicts: false,
}

export function extractAllIngredients(recipes: Recipe[]): string[] {
  const set = new Set<string>()
  for (const r of recipes) {
    for (const ing of r.ingredients || []) {
      if (ing.name?.trim()) set.add(ing.name.trim().toLowerCase())
    }
  }
  return Array.from(set).sort()
}

export function countActiveFilters(criteria: FilterCriteria): number {
  return (
    (criteria.searchQuery ? 1 : 0) +
    criteria.selectedIngredients.length +
    Object.values(criteria.selectedTags).reduce((acc, tags) => acc + tags.length, 0) +
    (criteria.maxTotalTime ? 1 : 0) +
    (criteria.hasImage !== null ? 1 : 0) +
    (criteria.onlyConflicts ? 1 : 0)
  )
}

export function filterRecipes(
  recipes: Recipe[],
  criteria: FilterCriteria,
  violationsMap: Map<number, RecipeConflict['violations']>
): Recipe[] {
  return recipes.filter((recipe) => {
    // 1. Text Search across Title, Description, Notes, Ingredients, Instructions
    if (criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim()
      const titleMatch = recipe.title.toLowerCase().includes(q)
      const descMatch = (recipe.description || '').toLowerCase().includes(q)
      const notesMatch = (recipe.notes || '').toLowerCase().includes(q)
      const ingredientMatch = (recipe.ingredients || []).some((i) =>
        i.name.toLowerCase().includes(q)
      )
      const instructionMatch =
        typeof recipe.instructions === 'string'
          ? recipe.instructions.toLowerCase().includes(q)
          : Array.isArray(recipe.instructions)
          ? (recipe.instructions as Array<{ text?: string } | string>).some((item) => {
              if (typeof item === 'string') return item.toLowerCase().includes(q)
              return Boolean(item?.text && item.text.toLowerCase().includes(q))
            })
          : false

      if (!titleMatch && !descMatch && !notesMatch && !ingredientMatch && !instructionMatch) {
        return false
      }
    }

    // 2. Max Total Time limit
    if (criteria.maxTotalTime !== undefined && recipe.total_time_minutes > criteria.maxTotalTime) {
      return false
    }

    // 3. Image requirement
    if (criteria.hasImage === true && (!recipe.image_url || !recipe.image_url.trim())) {
      return false
    }

    // 4. Conflicts requirement
    const hasConflict = violationsMap.has(recipe.id)
    if (criteria.onlyConflicts && !hasConflict) {
      return false
    }

    // 5. Selected Ingredients (Any / All matching)
    if (criteria.selectedIngredients.length > 0) {
      const recipeIngNames = (recipe.ingredients || []).map((i) => i.name.toLowerCase().trim())
      const mode = criteria.matchModePerElement.ingredients

      if (mode === 'all') {
        const hasAll = criteria.selectedIngredients.every((target) =>
          recipeIngNames.some((n) => n.includes(target))
        )
        if (!hasAll) return false
      } else {
        const hasAny = criteria.selectedIngredients.some((target) =>
          recipeIngNames.some((n) => n.includes(target))
        )
        if (!hasAny) return false
      }
    }

    // 6. Selected Tags per Category (Any / All matching)
    const selectedCatEntries = Object.entries(criteria.selectedTags)
    if (selectedCatEntries.length > 0) {
      for (const [catId, wantedTags] of selectedCatEntries) {
        if (!wantedTags || wantedTags.length === 0) continue
        const recipeTagsInCat = recipe.tags?.[catId] || []
        const catMode = criteria.matchModePerElement.categoryTags[catId] || 'any'

        if (catMode === 'all') {
          const hasAllTags = wantedTags.every((w) => recipeTagsInCat.includes(w))
          if (!hasAllTags) return false
        } else {
          const hasAnyTag = wantedTags.some((w) => recipeTagsInCat.includes(w))
          if (!hasAnyTag) return false
        }
      }
    }

    return true
  })
}

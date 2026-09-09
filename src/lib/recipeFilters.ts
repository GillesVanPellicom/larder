import type { FilterCriteria, Recipe, RecipeConflict } from '@/shared/types'

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  searchQuery: '',
  matchModePerElement: {
    ingredients: 'any',
    tags: 'any',
    categoryTags: {},
  },
  selectedIngredients: [],
  selectedTags: {},
  maxTotalTime: undefined,
  maxPrepTime: undefined,
  maxCookTime: undefined,
  hasImage: 'any',
  onlyConflicts: 'any',
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
  const hasImageFilterActive =
    criteria.hasImage === 'only' ||
    criteria.hasImage === 'none' ||
    criteria.hasImage === true ||
    criteria.hasImage === false
  const conflictsFilterActive =
    criteria.onlyConflicts === 'only' ||
    criteria.onlyConflicts === 'none' ||
    criteria.onlyConflicts === true

  return (
    (criteria.searchQuery ? 1 : 0) +
    criteria.selectedIngredients.length +
    Object.values(criteria.selectedTags).reduce((acc, tags) => acc + tags.length, 0) +
    (criteria.maxTotalTime ? 1 : 0) +
    (hasImageFilterActive ? 1 : 0) +
    (conflictsFilterActive ? 1 : 0)
  )
}

export function filterRecipes(
  recipes: Recipe[],
  criteria: FilterCriteria,
  violationsMap: Map<number, RecipeConflict['violations']>
): Recipe[] {
  return recipes.filter((recipe) => {
    // 1. Text Search across Title, Description, Source, Ingredients, Instructions
    if (criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase().trim()
      const titleMatch = recipe.title.toLowerCase().includes(q)
      const descMatch = (recipe.description || '').toLowerCase().includes(q)
      const sourceMatch = (recipe.source_url || '').toLowerCase().includes(q)
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

      if (!titleMatch && !descMatch && !sourceMatch && !ingredientMatch && !instructionMatch) {
        return false
      }
    }

    // 2. Max Total Time limit
    if (criteria.maxTotalTime !== undefined && recipe.total_time_minutes > criteria.maxTotalTime) {
      return false
    }

    // 3. Image requirement (any / none / only)
    const hasImageValue = Boolean(recipe.image_url && recipe.image_url.trim())
    if ((criteria.hasImage === 'only' || criteria.hasImage === true) && !hasImageValue) {
      return false
    }
    if ((criteria.hasImage === 'none' || criteria.hasImage === false) && hasImageValue) {
      return false
    }

    // 4. Data rule violations / conflicts requirement (any / none / only)
    const hasConflict = violationsMap.has(recipe.id)
    if ((criteria.onlyConflicts === 'only' || criteria.onlyConflicts === true) && !hasConflict) {
      return false
    }
    if (criteria.onlyConflicts === 'none' && hasConflict) {
      return false
    }

    // 5. Selected Ingredients (Any / All / None matching)
    if (criteria.selectedIngredients.length > 0) {
      const recipeIngNames = (recipe.ingredients || []).map((i) => i.name.toLowerCase().trim())
      const mode = criteria.matchModePerElement.ingredients

      if (mode === 'all') {
        const hasAll = criteria.selectedIngredients.every((target) =>
          recipeIngNames.some((n) => n.includes(target))
        )
        if (!hasAll) return false
      } else if (mode === 'none') {
        const hasAny = criteria.selectedIngredients.some((target) =>
          recipeIngNames.some((n) => n.includes(target))
        )
        if (hasAny) return false
      } else {
        const hasAny = criteria.selectedIngredients.some((target) =>
          recipeIngNames.some((n) => n.includes(target))
        )
        if (!hasAny) return false
      }
    }

    // 6. Selected Tags per Category (Any / All / None matching)
    const selectedCatEntries = Object.entries(criteria.selectedTags)
    if (selectedCatEntries.length > 0) {
      for (const [catId, wantedTags] of selectedCatEntries) {
        if (!wantedTags || wantedTags.length === 0) continue
        const recipeTagsInCat = (recipe.tags?.[catId] || []).map((t) => t.toLowerCase().trim())
        const catMode = criteria.matchModePerElement.categoryTags[catId] || criteria.matchModePerElement.tags || 'any'
        const lowerWanted = wantedTags.map((w) => w.toLowerCase().trim())

        if (catMode === 'all') {
          const hasAllTags = lowerWanted.every((w) => recipeTagsInCat.includes(w))
          if (!hasAllTags) return false
        } else if (catMode === 'none') {
          const hasAnyTag = lowerWanted.some((w) => recipeTagsInCat.includes(w))
          if (hasAnyTag) return false
        } else {
          const hasAnyTag = lowerWanted.some((w) => recipeTagsInCat.includes(w))
          if (!hasAnyTag) return false
        }
      }
    }

    return true
  })
}

import type { FilterCriteria } from '@/shared/types'

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



export function areFilterCriteriaEqual(a: FilterCriteria, b: FilterCriteria): boolean {
  if ((a.searchQuery || '').trim() !== (b.searchQuery || '').trim()) return false
  if (a.maxTotalTime !== b.maxTotalTime) return false

  const aImage = a.hasImage === true ? 'only' : a.hasImage === false ? 'none' : a.hasImage || 'any'
  const bImage = b.hasImage === true ? 'only' : b.hasImage === false ? 'none' : b.hasImage || 'any'
  if (aImage !== bImage) return false

  const aConflicts = a.onlyConflicts === true ? 'only' : a.onlyConflicts === false ? 'none' : a.onlyConflicts || 'any'
  const bConflicts = b.onlyConflicts === true ? 'only' : b.onlyConflicts === false ? 'none' : b.onlyConflicts || 'any'
  if (aConflicts !== bConflicts) return false

  // Ingredients
  const aIngs = [...(a.selectedIngredients || [])].sort()
  const bIngs = [...(b.selectedIngredients || [])].sort()
  if (aIngs.length !== bIngs.length) return false
  if (!aIngs.every((ing, i) => ing === bIngs[i])) return false
  if (aIngs.length > 0 && a.matchModePerElement.ingredients !== b.matchModePerElement.ingredients) return false

  // Tags
  const aCatKeys = Object.keys(a.selectedTags || {}).filter((k) => (a.selectedTags[k] || []).length > 0).sort()
  const bCatKeys = Object.keys(b.selectedTags || {}).filter((k) => (b.selectedTags[k] || []).length > 0).sort()
  if (aCatKeys.length !== bCatKeys.length) return false
  if (!aCatKeys.every((cat, i) => cat === bCatKeys[i])) return false

  for (const cat of aCatKeys) {
    const aTags = [...(a.selectedTags[cat] || [])].sort()
    const bTags = [...(b.selectedTags[cat] || [])].sort()
    if (aTags.length !== bTags.length) return false
    if (!aTags.every((t, i) => t === bTags[i])) return false

    const aMode = a.matchModePerElement.categoryTags?.[cat] || a.matchModePerElement.tags || 'any'
    const bMode = b.matchModePerElement.categoryTags?.[cat] || b.matchModePerElement.tags || 'any'
    if (aMode !== bMode) return false
  }

  return true
}

export function summarizeFilterCriteria(criteria: FilterCriteria): string[] {
  const parts: string[] = []
  if (criteria.searchQuery?.trim()) {
    parts.push(`"${criteria.searchQuery.trim()}"`)
  }
  if (criteria.maxTotalTime) {
    parts.push(`≤ ${criteria.maxTotalTime} min`)
  }
  if (criteria.selectedIngredients?.length) {
    parts.push(`${criteria.selectedIngredients.length} ingredient${criteria.selectedIngredients.length > 1 ? 's' : ''}`)
  }
  const tagCount = Object.values(criteria.selectedTags || {}).reduce((acc, t) => acc + (t?.length || 0), 0)
  if (tagCount > 0) {
    parts.push(`${tagCount} tag${tagCount > 1 ? 's' : ''}`)
  }
  if (criteria.hasImage && criteria.hasImage !== 'any') {
    parts.push(`Image: ${criteria.hasImage === 'only' ? 'Only' : 'None'}`)
  }
  if (criteria.onlyConflicts && criteria.onlyConflicts !== 'any') {
    parts.push(`Violations: ${criteria.onlyConflicts === 'only' ? 'Only' : 'None'}`)
  }
  return parts
}

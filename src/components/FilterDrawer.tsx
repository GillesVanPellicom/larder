import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { FilterCriteria, MatchMode, TagCategory } from '@/shared/types'
import { Clock, Filter, RotateCcw, Search, Sparkles, X } from 'lucide-react'

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criteria: FilterCriteria
  onChange: (criteria: FilterCriteria) => void
  categories: TagCategory[]
  allIngredients: string[]
  matchCount: number
  totalCount: number
}

export function FilterDrawer({
  open,
  onOpenChange,
  criteria,
  onChange,
  categories,
  allIngredients,
  matchCount,
  totalCount,
}: FilterDrawerProps) {
  const setIngredientsMatchMode = (mode: MatchMode) => {
    onChange({
      ...criteria,
      matchModePerElement: {
        ...criteria.matchModePerElement,
        ingredients: mode,
      },
    })
  }

  const setCategoryMatchMode = (categoryId: string, mode: MatchMode) => {
    onChange({
      ...criteria,
      matchModePerElement: {
        ...criteria.matchModePerElement,
        categoryTags: {
          ...criteria.matchModePerElement.categoryTags,
          [categoryId]: mode,
        },
      },
    })
  }

  const toggleTag = (categoryId: string, tag: string) => {
    const current = criteria.selectedTags[categoryId] || []
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag]

    const nextSelectedTags = { ...criteria.selectedTags }
    if (updated.length > 0) {
      nextSelectedTags[categoryId] = updated
    } else {
      delete nextSelectedTags[categoryId]
    }

    onChange({
      ...criteria,
      selectedTags: nextSelectedTags,
    })
  }

  const toggleIngredient = (ingredient: string) => {
    const current = criteria.selectedIngredients
    const updated = current.includes(ingredient)
      ? current.filter((i) => i !== ingredient)
      : [...current, ingredient]

    onChange({
      ...criteria,
      selectedIngredients: updated,
    })
  }

  const resetAll = () => {
    onChange({
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
    })
  }

  const activeFiltersCount =
    (criteria.searchQuery ? 1 : 0) +
    criteria.selectedIngredients.length +
    Object.values(criteria.selectedTags).reduce((acc, tags) => acc + tags.length, 0) +
    (criteria.maxTotalTime ? 1 : 0) +
    (criteria.hasImage !== null ? 1 : 0) +
    (criteria.onlyConflicts ? 1 : 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0 bg-white dark:bg-neutral-900 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 p-5 pb-4">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Filter className="h-4 w-4" />
                </div>
                <SheetTitle className="text-lg font-bold">Filter Recipes</SheetTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetAll}
                  className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset all
                </Button>
              )}
            </div>
            <SheetDescription className="text-xs text-neutral-500 mt-1">
              Configure per-element &ldquo;Any&rdquo; or &ldquo;All&rdquo; rules across tags, ingredients, and time.
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Filter Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Text Search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search titles, ingredients, notes..."
                value={criteria.searchQuery}
                onChange={(e) => onChange({ ...criteria, searchQuery: e.target.value })}
                className="pl-8 text-sm"
              />
              {criteria.searchQuery && (
                <button
                  type="button"
                  onClick={() => onChange({ ...criteria, searchQuery: '' })}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Time Filter */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Max Total Time</span>
              </label>
              {criteria.maxTotalTime && (
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  ≤ {criteria.maxTotalTime} mins
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[15, 30, 45, 60, 90].map((mins) => {
                const isSelected = criteria.maxTotalTime === mins
                return (
                  <Button
                    key={mins}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="xs"
                    onClick={() =>
                      onChange({
                        ...criteria,
                        maxTotalTime: isSelected ? undefined : mins,
                      })
                    }
                    className="text-xs font-medium cursor-pointer"
                  >
                    ≤ {mins}m
                  </Button>
                )
              })}
              {criteria.maxTotalTime && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onChange({ ...criteria, maxTotalTime: undefined })}
                  className="text-xs text-neutral-400"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Ingredients Filter with ANY / ALL Toggle */}
          <div className="space-y-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Ingredients
                </span>
                <p className="text-[11px] text-neutral-500">
                  Filter by pantry items
                </p>
              </div>

              {/* Per-Element Any / All Selector */}
              <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setIngredientsMatchMode('any')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                    criteria.matchModePerElement.ingredients === 'any'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  ANY
                </button>
                <button
                  type="button"
                  onClick={() => setIngredientsMatchMode('all')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                    criteria.matchModePerElement.ingredients === 'all'
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  ALL
                </button>
              </div>
            </div>

            {allIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allIngredients.slice(0, 20).map((ing) => {
                  const isSelected = criteria.selectedIngredients.includes(ing)
                  return (
                    <Badge
                      key={ing}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => toggleIngredient(ing)}
                      className="cursor-pointer transition-transform active:scale-95 text-xs py-1"
                    >
                      {ing}
                    </Badge>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic">No ingredients found.</p>
            )}
          </div>

          {/* Tags Categories with Individual Per-Category ANY / ALL */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Tag Categories
              </label>
              <span className="text-[11px] text-neutral-400">
                Mode configurable per category
              </span>
            </div>

            {categories.map((cat) => {
              const categorySelectedTags = criteria.selectedTags[cat.id] || []
              const mode = criteria.matchModePerElement.categoryTags[cat.id] || 'any'

              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {cat.name}
                      </span>
                      {categorySelectedTags.length > 0 && (
                        <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.2 rounded-full font-mono">
                          {categorySelectedTags.length}
                        </span>
                      )}
                    </div>

                    {/* Per-Category Any/All Toggle */}
                    <div className="flex items-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-800 dark:bg-neutral-900">
                      <button
                        type="button"
                        onClick={() => setCategoryMatchMode(cat.id, 'any')}
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          mode === 'any'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-neutral-400 hover:text-neutral-700'
                        }`}
                      >
                        ANY
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryMatchMode(cat.id, 'all')}
                        className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                          mode === 'all'
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                            : 'text-neutral-400 hover:text-neutral-700'
                        }`}
                      >
                        ALL
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(cat.tags || []).map((tag) => {
                      const isSelected = categorySelectedTags.includes(tag)
                      return (
                        <Badge
                          key={tag}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => toggleTag(cat.id, tag)}
                          className="cursor-pointer transition-transform active:scale-95 text-xs py-1"
                        >
                          {tag}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conflict & Image Toggles */}
          <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Special Views
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={criteria.onlyConflicts ? 'destructive' : 'outline'}
                size="sm"
                onClick={() =>
                  onChange({
                    ...criteria,
                    onlyConflicts: !criteria.onlyConflicts,
                  })
                }
                className="justify-start text-xs font-normal"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                <span>Conflicts Only</span>
              </Button>

              <Button
                type="button"
                variant={criteria.hasImage === true ? 'secondary' : 'outline'}
                size="sm"
                onClick={() =>
                  onChange({
                    ...criteria,
                    hasImage: criteria.hasImage === true ? null : true,
                  })
                }
                className="justify-start text-xs font-normal"
              >
                <span>Has Image</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Drawer Footer with Result Count */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Matching{' '}
            <strong className="text-neutral-900 dark:text-neutral-100 font-semibold">
              {matchCount}
            </strong>{' '}
            of {totalCount} recipes
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Show {matchCount} {matchCount === 1 ? 'Recipe' : 'Recipes'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { useState, useEffect } from 'react'
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
import { Filter, RotateCcw, Search, X } from 'lucide-react'
import { DEFAULT_FILTER_CRITERIA, countActiveFilters } from '@/lib/recipeFilters'
import { FilterIngredientsSection } from './FilterIngredientsSection'
import { FilterTagsSection } from './FilterTagsSection'
import { FilterQuickOptionsSection } from './FilterQuickOptionsSection'

export interface FilterDrawerProps {
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
  const activeFiltersCount = countActiveFilters(criteria)
  const [draftSearch, setDraftSearch] = useState(criteria.searchQuery)

  useEffect(() => {
    setDraftSearch(criteria.searchQuery)
  }, [criteria.searchQuery])

  const handleCommitSearch = () => {
    const trimmed = draftSearch.trim()
    if (trimmed !== criteria.searchQuery) {
      onChange({ ...criteria, searchQuery: trimmed })
    }
  }

  const handleClearSearch = () => {
    setDraftSearch('')
    onChange({ ...criteria, searchQuery: '' })
  }

  const handleResetAll = () => {
    setDraftSearch('')
    onChange(DEFAULT_FILTER_CRITERIA)
  }

  const handleSelectedIngredientsChange = (selected: string[]) => {
    onChange({
      ...criteria,
      selectedIngredients: selected,
    })
  }

  const handleIngredientsMatchModeChange = (mode: MatchMode) => {
    onChange({
      ...criteria,
      matchModePerElement: {
        ...criteria.matchModePerElement,
        ingredients: mode,
      },
    })
  }

  const handleCategoryTagsChange = (categoryId: string, tags: string[]) => {
    const nextSelectedTags = { ...criteria.selectedTags }
    if (tags.length > 0) {
      nextSelectedTags[categoryId] = tags
    } else {
      delete nextSelectedTags[categoryId]
    }

    onChange({
      ...criteria,
      selectedTags: nextSelectedTags,
    })
  }

  const handleCategoryMatchModeChange = (categoryId: string, mode: MatchMode) => {
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
                  onClick={handleResetAll}
                  className="h-8 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 cursor-pointer"
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

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Search */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Text Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400 cursor-pointer hover:text-foreground"
                onClick={handleCommitSearch}
              />
              <Input
                placeholder="Search titles, ingredients, source..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCommitSearch()
                  }
                }}
                className="pl-8 text-sm"
              />
              {draftSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Options: Time, Conflicts, Image */}
          <FilterQuickOptionsSection
            maxTotalTime={criteria.maxTotalTime}
            onlyConflicts={Boolean(criteria.onlyConflicts)}
            hasImage={criteria.hasImage ?? null}
            onMaxTimeChange={(mins) => onChange({ ...criteria, maxTotalTime: mins })}
            onToggleConflicts={() =>
              onChange({ ...criteria, onlyConflicts: !criteria.onlyConflicts })
            }
            onToggleHasImage={() =>
              onChange({
                ...criteria,
                hasImage: criteria.hasImage === true ? null : true,
              })
            }
          />

          {/* Ingredients Filter Section */}
          <FilterIngredientsSection
            allIngredients={allIngredients}
            selectedIngredients={criteria.selectedIngredients}
            matchMode={criteria.matchModePerElement.ingredients}
            onSelectedIngredientsChange={handleSelectedIngredientsChange}
            onMatchModeChange={handleIngredientsMatchModeChange}
          />

          {/* Tags Categories Section */}
          <FilterTagsSection
            categories={categories}
            selectedTags={criteria.selectedTags}
            matchModes={criteria.matchModePerElement.categoryTags}
            onCategoryTagsChange={handleCategoryTagsChange}
            onCategoryMatchModeChange={handleCategoryMatchModeChange}
          />
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

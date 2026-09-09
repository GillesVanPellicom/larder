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
import type { FilterCriteria, MatchMode, TagCategory, TriStateFilter } from '@/shared/types'
import { RotateCcw, Search, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  matchCount?: number
  totalCount?: number
}

export function FilterDrawer({
  open,
  onOpenChange,
  criteria,
  onChange,
  categories,
  allIngredients,
}: FilterDrawerProps) {
  const [draftCriteria, setDraftCriteria] = useState<FilterCriteria>(criteria)

  useEffect(() => {
    if (open) {
      setDraftCriteria(criteria)
    }
  }, [open, criteria])

  const activeFiltersCount = countActiveFilters(draftCriteria)

  const handleApply = () => {
    onChange(draftCriteria)
    onOpenChange(false)
  }

  const handleClearSearch = () => {
    setDraftCriteria((prev) => ({ ...prev, searchQuery: '' }))
  }

  const handleResetAll = () => {
    setDraftCriteria(DEFAULT_FILTER_CRITERIA)
  }

  const handleSelectedIngredientsChange = (selected: string[]) => {
    setDraftCriteria((prev) => ({
      ...prev,
      selectedIngredients: selected,
    }))
  }

  const handleIngredientsMatchModeChange = (mode: MatchMode) => {
    setDraftCriteria((prev) => ({
      ...prev,
      matchModePerElement: {
        ...prev.matchModePerElement,
        ingredients: mode,
      },
    }))
  }

  const handleCategoryTagsChange = (categoryId: string, tags: string[]) => {
    setDraftCriteria((prev) => {
      const nextSelectedTags = { ...prev.selectedTags }
      if (tags.length > 0) {
        nextSelectedTags[categoryId] = tags
      } else {
        delete nextSelectedTags[categoryId]
      }
      return {
        ...prev,
        selectedTags: nextSelectedTags,
      }
    })
  }

  const handleCategoryMatchModeChange = (categoryId: string, mode: MatchMode) => {
    setDraftCriteria((prev) => ({
      ...prev,
      matchModePerElement: {
        ...prev.matchModePerElement,
        categoryTags: {
          ...prev.matchModePerElement.categoryTags,
          [categoryId]: mode,
        },
      },
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg flex flex-col p-0 bg-background overflow-hidden"
      >
        {/* Drawer Header with fixed height to prevent layout shift */}
        <div className="h-14 shrink-0 border-b border-border px-5 flex items-center">
          <SheetHeader className="w-full text-left">
            <div className="flex items-center justify-between h-7">
              <div className="flex items-center gap-2 h-7 min-w-0">
                <SheetTitle className="text-base font-bold">Filter Recipes</SheetTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5 flex items-center shrink-0">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center h-7 shrink-0">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetAll}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset all
                  </Button>
                )}
              </div>
            </div>
            <SheetDescription className="sr-only">
              Filter recipe catalog by tags, ingredients, time, and search
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">
              Text search
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search titles, ingredients, source..."
                value={draftCriteria.searchQuery}
                onChange={(e) =>
                  setDraftCriteria((prev) => ({ ...prev, searchQuery: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleApply()
                  }
                }}
                className="pl-8 text-sm"
              />
              {draftCriteria.searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Max Total Time Section */}
          <FilterQuickOptionsSection
            maxTotalTime={draftCriteria.maxTotalTime}
            onMaxTimeChange={(mins) =>
              setDraftCriteria((prev) => ({ ...prev, maxTotalTime: mins }))
            }
          />

          {/* Ingredients Filter Section */}
          <FilterIngredientsSection
            allIngredients={allIngredients}
            selectedIngredients={draftCriteria.selectedIngredients}
            matchMode={draftCriteria.matchModePerElement.ingredients}
            onSelectedIngredientsChange={handleSelectedIngredientsChange}
            onMatchModeChange={handleIngredientsMatchModeChange}
          />

          {/* Tags Categories Section */}
          <FilterTagsSection
            categories={categories}
            selectedTags={draftCriteria.selectedTags}
            matchModes={draftCriteria.matchModePerElement.categoryTags}
            onCategoryTagsChange={handleCategoryTagsChange}
            onCategoryMatchModeChange={handleCategoryMatchModeChange}
          />

          {/* Divider under last category tag */}
          <hr className="border-border" />

          {/* Data Rule Violations Tri-State Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">
              Has data rule violation(s)
            </label>
            <Select
              value={
                typeof draftCriteria.onlyConflicts === 'string'
                  ? draftCriteria.onlyConflicts
                  : draftCriteria.onlyConflicts
                  ? 'only'
                  : 'any'
              }
              onValueChange={(val) =>
                setDraftCriteria((prev) => ({
                  ...prev,
                  onlyConflicts: (val as TriStateFilter) || 'any',
                }))
              }
            >
              <SelectTrigger className="w-full text-xs h-9 justify-between cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any" className="text-xs cursor-pointer">
                  Any
                </SelectItem>
                <SelectItem value="none" className="text-xs cursor-pointer">
                  None
                </SelectItem>
                <SelectItem value="only" className="text-xs cursor-pointer">
                  Only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Has Image Tri-State Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground">
              Has image
            </label>
            <Select
              value={
                typeof draftCriteria.hasImage === 'string'
                  ? draftCriteria.hasImage
                  : draftCriteria.hasImage === true
                  ? 'only'
                  : draftCriteria.hasImage === false
                  ? 'none'
                  : 'any'
              }
              onValueChange={(val) =>
                setDraftCriteria((prev) => ({
                  ...prev,
                  hasImage: (val as TriStateFilter) || 'any',
                }))
              }
            >
              <SelectTrigger className="w-full text-xs h-9 justify-between cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any" className="text-xs cursor-pointer">
                  Any
                </SelectItem>
                <SelectItem value="none" className="text-xs cursor-pointer">
                  None
                </SelectItem>
                <SelectItem value="only" className="text-xs cursor-pointer">
                  Only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-border p-4 bg-muted/20 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleApply}
            className="cursor-pointer"
          >
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

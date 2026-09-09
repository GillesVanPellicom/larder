import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getShortcutLabel } from '@/lib/shortcuts'
import { Filter, Plus, RotateCcw, Search, X } from 'lucide-react'

interface CatalogToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeFiltersCount: number
  onResetFilters: () => void
  onOpenFilterDrawer: () => void
  onNewRecipe: () => void
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  activeFiltersCount,
  onResetFilters,
  onOpenFilterDrawer,
  onNewRecipe,
}: CatalogToolbarProps) {
  const [draftQuery, setDraftQuery] = useState(searchQuery)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync draft whenever searchQuery changes externally
  useEffect(() => {
    setDraftQuery(searchQuery)
  }, [searchQuery])

  const handleCommit = () => {
    const trimmed = draftQuery.trim()
    if (trimmed !== searchQuery) {
      onSearchChange(trimmed)
    }
  }

  const handleClear = () => {
    setDraftQuery('')
    onSearchChange('')
    inputRef.current?.focus()
  }

  return (
    <div className="flex items-center gap-2.5">
      {/* Search Input (Executed on Enter) */}
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          onClick={handleCommit}
        />
        <Input
          ref={inputRef}
          placeholder="Search recipes, instructions..."
          value={draftQuery}
          onChange={(e) => setDraftQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleCommit()
            }
          }}
          className="pl-9.5 pr-9 text-base md:text-sm bg-card border-border shadow-2xs"
        />
        {draftQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ButtonGroup: [Reset Filters] [Filters Trigger] */}
      <div className="relative shrink-0">
        <ButtonGroup orientation="horizontal" className="shadow-2xs">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={onResetFilters}
                  disabled={activeFiltersCount === 0}
                  className="border-border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Reset filters"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent>Reset filters</TooltipContent>
          </Tooltip>

          {/* Filters Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => onOpenFilterDrawer()}
                  className="border-border cursor-pointer relative"
                  aria-label="Filter recipes"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              }
            />
            <TooltipContent>
              {activeFiltersCount > 0
                ? `${activeFiltersCount} active filter${activeFiltersCount > 1 ? 's' : ''}${getShortcutLabel('f')}`
                : `Filters${getShortcutLabel('f')}`}
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>

        {activeFiltersCount > 0 && (
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs pointer-events-none">
            {activeFiltersCount}
          </span>
        )}
      </div>

      {/* Primary Add Recipe Button (Desktop Only) */}
      <Button
        type="button"
        variant="default"
        onClick={onNewRecipe}
        className="hidden sm:inline-flex items-center gap-1.5 shrink-0 shadow-2xs font-semibold cursor-pointer"
        aria-label="Add recipe"
      >
        <Plus className="h-4 w-4" />
        <span>Add</span>
      </Button>
    </div>
  )
}

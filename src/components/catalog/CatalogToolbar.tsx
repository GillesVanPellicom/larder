import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Filter, RotateCcw, Search, X } from 'lucide-react'

interface CatalogToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeFiltersCount: number
  onResetFilters: () => void
  onOpenFilterDrawer: () => void
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  activeFiltersCount,
  onResetFilters,
  onOpenFilterDrawer,
}: CatalogToolbarProps) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search recipes, ingredients, instructions... (Cmd+F)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 h-9 text-sm bg-card border-border shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ButtonGroup: [Reset Filters] [Filter Drawer Trigger] */}
      <ButtonGroup orientation="horizontal" className="shrink-0 shadow-2xs">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onResetFilters}
                disabled={activeFiltersCount === 0}
                className="h-9 w-9 border-border text-foreground hover:bg-muted cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Reset filters"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            }
          />
          <TooltipContent>Reset all filters</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={activeFiltersCount > 0 ? 'default' : 'outline'}
                size="icon"
                onClick={onOpenFilterDrawer}
                className="relative h-9 w-9 border-border cursor-pointer hover:bg-muted"
                aria-label="Filter drawer"
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-xs">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            }
          />
          <TooltipContent>
            {activeFiltersCount > 0
              ? `${activeFiltersCount} active filter${activeFiltersCount > 1 ? 's' : ''} (Cmd+F or F)`
              : 'Filters Drawer (Cmd+F or F)'}
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>
    </div>
  )
}

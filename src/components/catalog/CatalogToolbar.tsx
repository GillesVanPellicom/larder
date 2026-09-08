import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getShortcutLabel } from '@/lib/shortcuts'
import { Filter, RotateCcw, Search, Settings, X } from 'lucide-react'

interface CatalogToolbarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  activeFiltersCount: number
  onResetFilters: () => void
  onOpenFilterDrawer: () => void
  onOpenSettings: () => void
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  activeFiltersCount,
  onResetFilters,
  onOpenFilterDrawer,
  onOpenSettings,
}: CatalogToolbarProps) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search recipes, ingredients, instructions..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9.5 pr-9 text-base md:text-sm bg-card border-border shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ButtonGroup: [Reset Filters] [Filters Trigger] */}
      <ButtonGroup orientation="horizontal" className="shrink-0 shadow-2xs">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant={activeFiltersCount > 0 ? 'default' : 'outline'}
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

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onOpenFilterDrawer}
                className="relative border-border cursor-pointer hover:bg-muted"
                aria-label="Filters"
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
              ? `${activeFiltersCount} active filter${activeFiltersCount > 1 ? 's' : ''}${getShortcutLabel('f')}`
              : `Filters${getShortcutLabel('f')}`}
          </TooltipContent>
        </Tooltip>
      </ButtonGroup>

      {/* Settings Navigation Action */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onOpenSettings}
              className="border-border text-foreground hover:bg-muted cursor-pointer shrink-0 shadow-2xs"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
        <TooltipContent>Settings</TooltipContent>
      </Tooltip>
    </div>
  )
}

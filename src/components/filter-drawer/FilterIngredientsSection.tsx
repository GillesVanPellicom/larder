import { MultiCombobox } from '@/components/ui/multi-combobox'
import type { MatchMode } from '@/shared/types'

interface FilterIngredientsSectionProps {
  allIngredients: string[]
  selectedIngredients: string[]
  matchMode: MatchMode
  onSelectedIngredientsChange: (ingredients: string[]) => void
  onMatchModeChange: (mode: MatchMode) => void
}

export function FilterIngredientsSection({
  allIngredients,
  selectedIngredients,
  matchMode,
  onSelectedIngredientsChange,
  onMatchModeChange,
}: FilterIngredientsSectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground">
            Ingredients
          </label>
          {selectedIngredients.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-mono text-foreground">
              {selectedIngredients.length}
            </span>
          )}
        </div>

        {/* Per-Element Any / All / None Selector */}
        <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            type="button"
            onClick={() => onMatchModeChange('any')}
            className={`min-h-[30px] min-w-[44px] px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              matchMode === 'any'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Any
          </button>
          <button
            type="button"
            onClick={() => onMatchModeChange('all')}
            className={`min-h-[30px] min-w-[44px] px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              matchMode === 'all'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onMatchModeChange('none')}
            className={`min-h-[30px] min-w-[44px] px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              matchMode === 'none'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            None
          </button>
        </div>
      </div>

      <MultiCombobox
        options={allIngredients}
        values={selectedIngredients}
        onValuesChange={onSelectedIngredientsChange}
        placeholder="Search ingredients..."
        emptyMessage="No ingredients found."
      />
    </div>
  )
}

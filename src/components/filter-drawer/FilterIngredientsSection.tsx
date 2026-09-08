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
    <div className="space-y-2.5 rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ingredients
          </span>
          {selectedIngredients.length > 0 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-mono text-foreground">
              {selectedIngredients.length}
            </span>
          )}
        </div>

        {/* Per-Element Any / All Selector */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => onMatchModeChange('any')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              matchMode === 'any'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ANY
          </button>
          <button
            type="button"
            onClick={() => onMatchModeChange('all')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              matchMode === 'all'
                ? 'bg-foreground text-background shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            ALL
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

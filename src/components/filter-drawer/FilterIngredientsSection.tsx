import { Badge } from '@/components/ui/badge'
import type { MatchMode } from '@/shared/types'

interface FilterIngredientsSectionProps {
  allIngredients: string[]
  selectedIngredients: string[]
  matchMode: MatchMode
  onToggleIngredient: (ingredient: string) => void
  onMatchModeChange: (mode: MatchMode) => void
}

export function FilterIngredientsSection({
  allIngredients,
  selectedIngredients,
  matchMode,
  onToggleIngredient,
  onMatchModeChange,
}: FilterIngredientsSectionProps) {
  return (
    <div className="space-y-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3.5 dark:border-neutral-800 dark:bg-neutral-950/50">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Ingredients
          </span>
          <p className="text-[11px] text-neutral-500">Filter by pantry items</p>
        </div>

        {/* Per-Element Any / All Selector */}
        <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
          <button
            type="button"
            onClick={() => onMatchModeChange('any')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              matchMode === 'any'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            ANY
          </button>
          <button
            type="button"
            onClick={() => onMatchModeChange('all')}
            className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
              matchMode === 'all'
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
          {allIngredients.slice(0, 25).map((ing) => {
            const isSelected = selectedIngredients.includes(ing)
            return (
              <Badge
                key={ing}
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => onToggleIngredient(ing)}
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
  )
}

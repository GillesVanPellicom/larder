import { formatGracefulNumber } from '@/lib/recipeMath'
import type { IngredientItem } from '@/shared/types'
import { Check } from 'lucide-react'

interface RecipeIngredientsListProps {
  ingredients: IngredientItem[]
  checkedIngredients: Record<string, boolean>
  onToggleIngredient: (id: string) => void
  yieldMultiplier?: number
  onResetYield?: () => void
}

function renderAmountValue(amount: string, isScaled: boolean, isChecked: boolean) {
  if (!amount) return null
  if (!isScaled || isChecked) {
    return (
      <span className={isChecked ? 'text-muted-foreground' : 'text-foreground'}>
        {amount}
      </span>
    )
  }

  // Tokenize numbers (integers, decimals, fractions) to isolate numeric characters
  const tokens = amount.split(/(\d+(?:\.\d+)?|\d+\/\d+)/g)
  return (
    <>
      {tokens.map((token, i) => {
        if (/\d/.test(token)) {
          return (
            <span key={i} className="text-amber-600 dark:text-amber-400">
              {token}
            </span>
          )
        }
        return (
          <span key={i} className="text-foreground">
            {token}
          </span>
        )
      })}
    </>
  )
}

export function RecipeIngredientsList({
  ingredients,
  checkedIngredients,
  onToggleIngredient,
  yieldMultiplier = 1,
  onResetYield,
}: RecipeIngredientsListProps) {
  const isScaled = Math.abs(yieldMultiplier - 1) > 0.001

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground">
            Ingredients
          </h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
            {ingredients.length}
          </span>

          {onResetYield && isScaled && (
            <button
              type="button"
              onClick={onResetYield}
              className="inline-flex items-center text-[11px] font-mono font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer select-none bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 shadow-2xs"
              title="Click to reset yield to 1×"
            >
              <span>{formatGracefulNumber(yieldMultiplier)}×</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-xs space-y-1">
        {ingredients.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No ingredients specified.</p>
        ) : (
          ingredients.map((item, index) => {
            const isChecked = Boolean(checkedIngredients[item.id || String(index)])
            return (
              <div
                key={item.id || index}
                onClick={() => onToggleIngredient(item.id || String(index))}
                className={`flex items-start gap-2.5 py-1.5 px-2.5 rounded-xl cursor-pointer transition-colors select-none hover:bg-muted/40 ${
                  isChecked
                    ? 'text-muted-foreground line-through opacity-80'
                    : 'text-foreground'
                }`}
              >
                <button
                  type="button"
                  className={`mt-0.5 h-4.5 w-4.5 rounded flex items-center justify-center shrink-0 transition-colors border ${
                    isChecked
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  {isChecked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                </button>

                <div className="text-sm flex-1 leading-snug">
                  {(item.amount || item.unit) && (
                    <span className="mr-1.5 font-semibold">
                      {item.amount && renderAmountValue(item.amount, isScaled, isChecked)}
                      {item.amount && item.unit ? ' ' : ''}
                      {item.unit && (
                        <span className={isChecked ? 'text-muted-foreground' : 'text-foreground'}>
                          {item.unit}
                        </span>
                      )}
                    </span>
                  )}
                  <span>{item.name}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}


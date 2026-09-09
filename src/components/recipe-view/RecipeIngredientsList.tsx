import { formatGracefulNumber } from '@/lib/recipeMath'
import type { IngredientItem } from '@/shared/types'
import { Check, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'

interface RecipeIngredientsListProps {
  ingredients: IngredientItem[]
  checkedIngredients: Record<string, boolean>
  onToggleIngredient: (id: string) => void
  yieldMultiplier?: number
  onResetYield?: () => void
  isInShoppingList?: boolean
  onToggleShoppingList?: () => void
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
  isInShoppingList = false,
  onToggleShoppingList,
}: RecipeIngredientsListProps) {
  const isScaled = Math.abs(yieldMultiplier - 1) > 0.001

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
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

        {onToggleShoppingList && (
          <Button
            type="button"
            variant={isInShoppingList ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleShoppingList}
            className={cn(
              "h-8 text-xs gap-1.5 cursor-pointer rounded-lg shrink-0",
              isInShoppingList && "bg-primary text-primary-foreground"
            )}
          >
            {isInShoppingList ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">In shopping list</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add to shopping list</span>
              </>
            )}
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-2 sm:p-3">
        {ingredients.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-3 px-3">No ingredients specified.</p>
        ) : (
          ingredients.map((item, index) => {
            const itemKey = String(item.id ?? index)
            const isChecked = Boolean(checkedIngredients[itemKey])
            const hasQty = Boolean(item.amount || item.unit)

            return (
              <div key={itemKey}>
                {index > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                <div
                  onClick={() => onToggleIngredient(itemKey)}
                  className={cn(
                    'flex items-start gap-3.5 py-3.5 sm:py-3 px-3 sm:px-4 rounded-xl cursor-pointer transition-colors select-none hover:bg-muted/40 min-h-[3rem]',
                    isChecked ? 'text-muted-foreground opacity-70' : 'text-foreground'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors border',
                      isChecked
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/50'
                    )}
                  >
                    {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        title={item.name}
                        className={cn('text-sm sm:text-[15px] font-medium truncate', isChecked && 'line-through')}
                      >
                        {item.name}
                      </span>
                      {hasQty && (
                        <span
                          className={cn(
                            'text-xs sm:text-sm font-mono font-medium shrink-0 ml-2',
                            isChecked ? 'text-muted-foreground' : 'text-foreground'
                          )}
                        >
                          {item.amount && renderAmountValue(item.amount, isScaled, isChecked)}
                          {item.amount && item.unit ? ' ' : ''}
                          {item.unit && (
                            <span className={isChecked ? 'text-muted-foreground' : 'text-foreground'}>
                              {item.unit}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}


import { Button } from '@/components/ui/button'
import type { IngredientItem } from '@/shared/types'
import { CheckCircle2, CheckSquare, Utensils } from 'lucide-react'

interface RecipeIngredientsListProps {
  ingredients: IngredientItem[]
  checkedIngredients: Record<string, boolean>
  onToggleIngredient: (id: string) => void
  onOpenTodoDialog: () => void
}

export function RecipeIngredientsList({
  ingredients,
  checkedIngredients,
  onToggleIngredient,
  onOpenTodoDialog,
}: RecipeIngredientsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Utensils className="h-4 w-4 text-amber-500" />
            <span>Ingredients</span>
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            ({ingredients.length})
          </span>
        </div>

        {ingredients.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenTodoDialog}
            className="text-xs h-8 cursor-pointer border-border hover:bg-muted text-blue-600 dark:text-blue-400 gap-1.5"
            title="Add ingredients to Microsoft To Do"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Add to To Do</span>
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2">
        {ingredients.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">No ingredients specified.</p>
        ) : (
          ingredients.map((item, index) => {
            const isChecked = Boolean(checkedIngredients[item.id || String(index)])
            return (
              <div
                key={item.id || index}
                onClick={() => onToggleIngredient(item.id || String(index))}
                className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors select-none ${
                  isChecked
                    ? 'bg-muted/40 text-muted-foreground line-through opacity-70'
                    : 'hover:bg-muted/30 text-foreground'
                }`}
              >
                <button
                  type="button"
                  className={`mt-0.5 h-4.5 w-4.5 rounded flex items-center justify-center shrink-0 transition-colors border ${
                    isChecked
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border bg-card'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>

                <div className="text-sm flex-1 leading-snug">
                  {(item.amount || item.unit) && (
                    <strong className="mr-1.5 font-semibold text-foreground">
                      {[item.amount, item.unit].filter(Boolean).join(' ')}
                    </strong>
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

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { IngredientItem } from '@/shared/types'
import { Plus, Trash2 } from 'lucide-react'

interface RecipeIngredientsEditorProps {
  ingredients: IngredientItem[]
  onIngredientChange: (index: number, field: keyof IngredientItem, val: string) => void
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  isMandatory: boolean
  error?: string
}

export function RecipeIngredientsEditor({
  ingredients,
  onIngredientChange,
  onAddRow,
  onRemoveRow,
  isMandatory,
  error,
}: RecipeIngredientsEditorProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Ingredients {isMandatory && <span className="text-destructive">*</span>}
        </h2>
        <InfoTooltip content="Specify quantities, units, and ingredients. Press Enter to append a row." />
      </div>

      {error && (
        <div className="text-xs text-destructive font-medium">{error}</div>
      )}

      <div className="space-y-2">
        {ingredients.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              placeholder="Qty"
              value={item.amount || ''}
              onChange={(e) => onIngredientChange(idx, 'amount', e.target.value)}
              className="w-20 shrink-0 text-sm"
            />
            <Input
              placeholder="Unit (g, cup)"
              value={item.unit || ''}
              onChange={(e) => onIngredientChange(idx, 'unit', e.target.value)}
              className="w-28 shrink-0 text-sm"
            />
            <Input
              placeholder="Ingredient name"
              value={item.name}
              onChange={(e) => onIngredientChange(idx, 'name', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAddRow()
                }
              }}
              className="flex-1 text-sm font-medium"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onRemoveRow(idx)}
              disabled={ingredients.length <= 1}
              title="Remove ingredient"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 shrink-0 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddRow}
        className="text-xs font-semibold cursor-pointer border-dashed"
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Ingredient Row
      </Button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { IngredientItem } from '@/shared/types'
import { ListPlus, ListTodo, Sparkles } from 'lucide-react'

interface AddToTodoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipeTitle: string
  ingredients: IngredientItem[]
  checkedIngredients?: Record<string, boolean>
}

export function AddToTodoDialog({
  open,
  onOpenChange,
  recipeTitle,
  ingredients,
  checkedIngredients,
}: AddToTodoDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    ingredients.forEach((ing, idx) => {
      const key = ing.id || String(idx)
      const isAlreadyChecked = Boolean(
        checkedIngredients?.[ing.id] || checkedIngredients?.[String(idx)]
      )
      initial[key] = !isAlreadyChecked
    })
    return initial
  })
  const [added, setAdded] = useState(false)

  // Re-sync selection state whenever dialog opens or ingredients/checked list updates
  useEffect(() => {
    if (open) {
      const initial: Record<string, boolean> = {}
      ingredients.forEach((ing, idx) => {
        const key = ing.id || String(idx)
        const isAlreadyChecked = Boolean(
          checkedIngredients?.[ing.id] || checkedIngredients?.[String(idx)]
        )
        initial[key] = !isAlreadyChecked
      })
      setSelectedIds(initial)
    }
  }, [open, ingredients, checkedIngredients])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectAll = () => {
    const all: Record<string, boolean> = {}
    ingredients.forEach((ing, idx) => {
      all[ing.id || String(idx)] = true
    })
    setSelectedIds(all)
  }

  const deselectAll = () => {
    setSelectedIds({})
  }

  const handleConfirm = () => {
    setAdded(true)
    setTimeout(() => {
      setAdded(false)
      onOpenChange(false)
    }, 1500)
  }

  const count = Object.values(selectedIds).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Export to Microsoft To Do
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                For &ldquo;{recipeTitle}&rdquo;
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Target List Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Target List</label>
            <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20">
              <ListPlus className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium text-foreground">Groceries & Shopping List</span>
              <span className="ml-auto text-[10px] text-muted-foreground uppercase font-mono">Default</span>
            </div>
          </div>

          {/* Ingredients Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ingredients
                </label>
                <InfoTooltip content="Hint: Any ingredients you have checked before exporting won't be exported." />
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={selectAll}
                  className="hover:text-foreground cursor-pointer font-medium"
                >
                  Select all
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="hover:text-foreground cursor-pointer font-medium"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border bg-muted/20 p-2">
              {ingredients.map((ing, idx) => {
                const key = ing.id || String(idx)
                const checked = Boolean(selectedIds[key])
                return (
                  <div
                    key={key}
                    onClick={() => toggleSelect(key)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-card text-foreground' : 'text-muted-foreground opacity-60'
                    }`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleSelect(key)} />
                    <span className="truncate">
                      {[ing.amount, ing.unit, ing.name].filter(Boolean).join(' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Placeholder Banner */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-start gap-2.5 text-foreground">
            <Sparkles className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-xs block">Integration Placeholder</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Connects with Microsoft Graph API / To Do tasks. Clicking below simulates exporting these {count} ingredient(s) into your task list.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={count === 0 || added}
            className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            {added ? 'Exported to Microsoft To Do!' : `Export ${count} to To Do (Placeholder)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

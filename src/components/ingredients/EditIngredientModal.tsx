import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ingredientsApi, type IngredientRecord } from '@/services/api'
import { formatBelgianDateTime } from '@/lib/dateTime'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Edit3, Utensils } from 'lucide-react'

interface EditIngredientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: IngredientRecord | null
  onUpdated: (ingredient: IngredientRecord) => void
}

export function EditIngredientModal({
  open,
  onOpenChange,
  ingredient,
  onUpdated,
}: EditIngredientModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && ingredient) {
      setName(ingredient.name)
      setError(null)
    }
  }, [open, ingredient])

  if (!ingredient) return null

  const trimmed = name.trim()
  const isUnchanged = trimmed === ingredient.name
  const isInvalid = !trimmed

  const handleSubmit = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (isInvalid || isUnchanged) return

    try {
      setLoading(true)
      setError(null)
      const updated = await ingredientsApi.update(ingredient.id, trimmed)
      onUpdated({
        ...ingredient,
        name: updated.name,
      })
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update ingredient:', err)
      setError(err instanceof Error ? err.message : 'Failed to update ingredient.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/85 backdrop-blur-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Edit3 className="h-4 w-4 text-primary" />
            Edit ingredient
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Rename this ingredient across all associated recipes.
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-4 pt-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              void handleSubmit(e)
            }
          }}
        >
          {/* Name Field */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Ingredient name
              </label>
              <InfoTooltip content="Renaming will seamlessly update the ingredient name in all recipes using it." />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Tomato"
              autoFocus
              className="text-sm font-medium"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          {/* Usage & Metadata Details */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-primary" />
                Used in
              </span>
              <span className="font-semibold text-foreground">
                {ingredient.usage_count ?? 0}{' '}
                {(ingredient.usage_count ?? 0) === 1 ? 'recipe' : 'recipes'}
              </span>
            </div>
            {ingredient.created_at && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                <span>Created</span>
                <span className="font-medium text-foreground">
                  {formatBelgianDateTime(ingredient.created_at)}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 gap-2 flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                void handleSubmit(e)
              }}
              disabled={isInvalid || isUnchanged || loading}
              className="cursor-pointer"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

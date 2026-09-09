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
import { ingredientsApi } from '@/services/api'
import { Info, Plus } from 'lucide-react'

interface CreateIngredientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onCreated: (ingredient: { id: number; name: string }) => void
}

export function CreateIngredientModal({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: CreateIngredientModalProps) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setError(null)
    }
  }, [open, initialName])

  const handleSubmit = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Ingredient name cannot be empty.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const created = await ingredientsApi.create(trimmed)
      onCreated(created)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create ingredient:', err)
      setError(err instanceof Error ? err.message : 'Failed to create ingredient.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/85 backdrop-blur-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Plus className="h-4 w-4 text-primary" />
            New Ingredient
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add an ingredient for easy reuse and filtering across all your recipes.
          </DialogDescription>
        </DialogHeader>

        <div
          className="space-y-4 pt-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              handleSubmit(e)
            }
          }}
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block mb-1.5">
              Ingredient Name
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Tomato, Olive oil, Egg"
              autoFocus
              className="text-sm font-medium"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 font-medium text-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Naming Guidelines</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] leading-relaxed">
              <li>
                <strong>Singular form:</strong> Use <em>Potato</em> or <em>Egg</em> rather than <em>Potatoes</em> or <em>Eggs</em>.
              </li>
              <li>
                <strong>No adjectives or prep notes:</strong> Use <em>Tomato</em> or <em>Onion</em> instead of <em>Diced tomatoes</em> or <em>Fresh basil</em>.
              </li>
              <li>
                <strong>Editable anytime:</strong> Any ingredient can always be edited or renamed later in the ingredient database.
              </li>
              <li>
                <strong>Quantity &amp; Unit:</strong> Amounts and units (e.g. <em>200 g</em>, <em>2 tbsp</em>) are specified directly on each recipe row.
              </li>
            </ul>
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
                handleSubmit(e)
              }}
              disabled={!name.trim() || loading}
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

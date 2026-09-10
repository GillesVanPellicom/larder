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
import { storesApi } from '@/services/api'
import { Plus, Store } from 'lucide-react'

interface CreateStoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  onCreated: (store: { id: number; name: string }) => void
}

export function CreateStoreModal({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: CreateStoreModalProps) {
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
      setError('Store name cannot be empty.')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const created = await storesApi.create(trimmed)
      onCreated(created)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to create store:', err)
      setError(err instanceof Error ? err.message : 'Failed to create store.')
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
            New Store
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a store or merchant to organize your shopping list items.
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
              Store Name
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Delhaize, Bakery, Farmer's Market"
              autoFocus
              className="text-sm font-medium"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 font-medium text-foreground">
              <Store className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Store Organization</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] leading-relaxed">
              <li>
                <strong>Any Merchant or Location:</strong> Use store chains (<em>Colruyt</em>, <em>Trader Joe's</em>) or specialty shops (<em>Bakery</em>, <em>Butcher</em>, <em>Market</em>).
              </li>
              <li>
                <strong>Volatile shopping assignment:</strong> You can assign consolidated ingredients to stores on the fly when shopping without altering recipe ingredients.
              </li>
            </ul>
          </div>

          <DialogFooter className="pt-2 gap-2 flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
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

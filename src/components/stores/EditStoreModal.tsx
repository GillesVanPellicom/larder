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
import { storesApi, type StoreRecord } from '@/services/api'
import { formatBelgianDateTime } from '@/lib/dateTime'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Edit3, Store } from 'lucide-react'

interface EditStoreModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  store: StoreRecord | null
  onUpdated: (store: StoreRecord) => void
}

export function EditStoreModal({
  open,
  onOpenChange,
  store,
  onUpdated,
}: EditStoreModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && store) {
      setName(store.name)
      setError(null)
    }
  }, [open, store])

  if (!store) return null

  const trimmed = name.trim()
  const isUnchanged = trimmed === store.name
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
      const updated = await storesApi.update(store.id, trimmed)
      onUpdated({
        ...store,
        name: updated.name,
      })
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to update store:', err)
      setError(err instanceof Error ? err.message : 'Failed to update store.')
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
            Edit store
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Rename or manage this store.
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
                Store name
              </label>
              <InfoTooltip content="Renaming will update the store name across shopping lists and store selections." />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Delhaize"
              autoFocus
              className="text-sm font-medium"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          {/* Usage & Metadata Details */}
          {store.created_at && (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-primary" />
                  <span>Created</span>
                </span>
                <span className="font-medium text-foreground">
                  {formatBelgianDateTime(store.created_at)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 gap-2 flex-row justify-end items-center">
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

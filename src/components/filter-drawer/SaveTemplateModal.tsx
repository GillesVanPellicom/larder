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
import { Badge } from '@/components/ui/badge'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Bookmark, Loader2 } from 'lucide-react'
import type { FilterCriteria, FilterTemplate } from '@/shared/types'

interface SaveTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  criteria: FilterCriteria
  existingTemplate?: FilterTemplate | null
  onSave: (name: string) => Promise<void>
}

export function SaveTemplateModal({
  open,
  onOpenChange,
  criteria,
  existingTemplate,
  onSave,
}: SaveTemplateModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(existingTemplate?.name || '')
      setError(null)
    }
  }, [open, existingTemplate])

  const trimmed = name.trim()
  const isInvalid = !trimmed

  const hasAnyFilter =
    Boolean(criteria.searchQuery?.trim()) ||
    Boolean(criteria.maxTotalTime) ||
    (criteria.selectedIngredients && criteria.selectedIngredients.length > 0) ||
    Object.values(criteria.selectedTags || {}).some((tags) => tags && tags.length > 0) ||
    (criteria.onlyConflicts && criteria.onlyConflicts !== 'any') ||
    (criteria.hasImage && criteria.hasImage !== 'any')

  const handleSubmit = async (e?: React.FormEvent | React.SyntheticEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (isInvalid) return

    try {
      setLoading(true)
      setError(null)
      await onSave(trimmed)
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to save filter template:', err)
      setError(err instanceof Error ? err.message : 'Failed to save filter template.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/85 backdrop-blur-md border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Bookmark className="h-4 w-4 text-primary" />
            {existingTemplate ? 'Rename preset' : 'Save filter preset'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Save the current filter configuration as a reusable preset
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
          {/* Preset Name Input */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                Preset name
              </label>
              <InfoTooltip content="Give this filter preset a recognizable name for quick 1-click filtering." />
            </div>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Weekday summer, Quick pasta..."
              autoFocus
              className="text-sm font-medium"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          {/* Individual Filter Tags (matching catalogue style) */}
          {!existingTemplate && hasAnyFilter && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
              {criteria.searchQuery?.trim() && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                >
                  <span>&ldquo;{criteria.searchQuery.trim()}&rdquo;</span>
                </Badge>
              )}

              {criteria.maxTotalTime && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                >
                  <span>&le; {criteria.maxTotalTime} min</span>
                </Badge>
              )}

              {criteria.selectedIngredients?.map((ing) => (
                <Badge
                  key={ing}
                  variant="secondary"
                  className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                >
                  <span className="text-muted-foreground font-normal">Ingredient:</span>
                  <span>{ing}</span>
                </Badge>
              ))}

              {Object.entries(criteria.selectedTags || {}).map(([catId, tags]) =>
                (tags || []).map((tag) => (
                  <Badge
                    key={`${catId}-${tag}`}
                    variant="secondary"
                    className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                  >
                    <span className="text-muted-foreground font-normal">{catId}:</span>
                    <span>{tag}</span>
                  </Badge>
                ))
              )}

              {criteria.onlyConflicts && criteria.onlyConflicts !== 'any' && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                >
                  <span className="text-muted-foreground font-normal">Violations:</span>
                  <span>{criteria.onlyConflicts === 'only' ? 'Only' : 'None'}</span>
                </Badge>
              )}

              {criteria.hasImage && criteria.hasImage !== 'any' && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/60 text-foreground select-none"
                >
                  <span className="text-muted-foreground font-normal">Image:</span>
                  <span>{criteria.hasImage === 'only' ? 'Only' : 'None'}</span>
                </Badge>
              )}
            </div>
          )}

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
              onClick={handleSubmit}
              disabled={isInvalid || loading}
              className="cursor-pointer gap-1.5"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

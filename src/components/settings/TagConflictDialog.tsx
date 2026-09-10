import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'

export interface DeleteConflictData {
  categoryId: string
  tag: string
  usageCount: number
  recipes: { id: number; title: string }[]
  availableTags: string[]
}

interface TagConflictDialogProps {
  conflictData: DeleteConflictData | null
  reassignTarget: string
  loading: boolean
  onReassignTargetChange: (val: string) => void
  onClose: () => void
  onStripAndRemove: () => void
  onReassignAndRemove: () => void
}

export function TagConflictDialog({
  conflictData,
  reassignTarget,
  loading,
  onReassignTargetChange,
  onClose,
  onStripAndRemove,
  onReassignAndRemove,
}: TagConflictDialogProps) {
  if (!conflictData) return null

  return (
    <Dialog open={!!conflictData} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Tag In Use Conflict</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            The tag <strong className="text-foreground">&ldquo;{conflictData.tag}&rdquo;</strong> is
            currently assigned to{' '}
            <strong className="text-foreground">{conflictData.usageCount}</strong> recipe(s):
          </DialogDescription>
        </DialogHeader>

        {/* Affected Recipes List */}
        <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/40 p-2.5 text-xs space-y-1">
          {conflictData.recipes.map((r) => (
            <div key={r.id} className="text-foreground font-medium truncate">
              • {r.title}
            </div>
          ))}
        </div>

        {/* Reassignment Option */}
        {conflictData.availableTags.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-foreground">
              Option A: Reassign recipes to another tag
            </label>
            <div className="flex gap-2">
              <Select
                value={reassignTarget}
                onValueChange={(val) => onReassignTargetChange(val || '')}
              >
                <SelectTrigger className="flex-1 text-xs">
                  <SelectValue placeholder="Choose replacement tag..." />
                </SelectTrigger>
                <SelectContent>
                  {conflictData.availableTags.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="sm"
                disabled={!reassignTarget || loading}
                onClick={onReassignAndRemove}
                className="text-xs shrink-0 cursor-pointer"
              >
                Reassign & Delete
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={loading}
            onClick={onStripAndRemove}
            className="cursor-pointer"
          >
            Strip From Recipes & Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

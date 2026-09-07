import { Button } from '@/components/ui/button'
import { Clock, Sparkles } from 'lucide-react'

interface FilterQuickOptionsSectionProps {
  maxTotalTime?: number
  onlyConflicts: boolean
  hasImage: boolean | null
  onMaxTimeChange: (mins?: number) => void
  onToggleConflicts: () => void
  onToggleHasImage: () => void
}

export function FilterQuickOptionsSection({
  maxTotalTime,
  onlyConflicts,
  hasImage,
  onMaxTimeChange,
  onToggleConflicts,
  onToggleHasImage,
}: FilterQuickOptionsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>Max Total Time</span>
          </label>
          {maxTotalTime && (
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              ≤ {maxTotalTime} mins
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[15, 30, 45, 60, 90].map((mins) => {
            const isSelected = maxTotalTime === mins
            return (
              <Button
                key={mins}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="xs"
                onClick={() => onMaxTimeChange(isSelected ? undefined : mins)}
                className="text-xs font-medium cursor-pointer"
              >
                ≤ {mins}m
              </Button>
            )
          })}
          {maxTotalTime && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onMaxTimeChange(undefined)}
              className="text-xs text-neutral-400 cursor-pointer"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Special Views (Conflicts & Image Toggles) */}
      <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Special Views
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={onlyConflicts ? 'destructive' : 'outline'}
            size="sm"
            onClick={onToggleConflicts}
            className="justify-start text-xs font-normal cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            <span>Conflicts Only</span>
          </Button>

          <Button
            type="button"
            variant={hasImage === true ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleHasImage}
            className="justify-start text-xs font-normal cursor-pointer"
          >
            <span>Has Image</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/button'
import { PresetStepper } from '@/components/ui/stepper'
import { Clock, Sparkles } from 'lucide-react'

interface FilterQuickOptionsSectionProps {
  maxTotalTime?: number
  onlyConflicts: boolean
  hasImage: boolean | null
  onMaxTimeChange: (mins?: number) => void
  onToggleConflicts: () => void
  onToggleHasImage: () => void
}

const TIME_PRESETS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '45m', value: 45 },
  { label: '60m', value: 60 },
  { label: '90m', value: 90 },
]

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
          {maxTotalTime !== undefined && maxTotalTime > 0 && (
            <button
              type="button"
              onClick={() => onMaxTimeChange(undefined)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <PresetStepper
          value={maxTotalTime || 0}
          onChange={(val) => onMaxTimeChange(val <= 0 ? undefined : val)}
          min={0}
          max={360}
          step={15}
          symbol="min"
          variant="small"
          allowClearPreset
          onClear={() => onMaxTimeChange(undefined)}
          presets={TIME_PRESETS}
        />
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

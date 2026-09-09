import { PresetStepper } from '@/components/ui/stepper'
import { Clock } from 'lucide-react'

interface FilterQuickOptionsSectionProps {
  maxTotalTime?: number
  onMaxTimeChange: (mins?: number) => void
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
  onMaxTimeChange,
}: FilterQuickOptionsSectionProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Max total time</span>
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
  )
}

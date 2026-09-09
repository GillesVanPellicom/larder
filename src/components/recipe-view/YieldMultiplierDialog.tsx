import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PresetStepper } from '@/components/ui/stepper'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { RotateCcw } from 'lucide-react'

interface YieldMultiplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMultiplier: number
  onApplyMultiplier: (mult: number) => void
}

const SHORTCUTS = [
  { label: '½×', value: 0.5 },
  { label: '1×', value: 1 },
  { label: '2×', value: 2 },
  { label: '3×', value: 3 },
  { label: '4×', value: 4 },
]

export function YieldMultiplierDialog({
  open,
  onOpenChange,
  currentMultiplier,
  onApplyMultiplier,
}: YieldMultiplierDialogProps) {
  const [multiplier, setMultiplier] = useState(currentMultiplier)

  useEffect(() => {
    if (open) {
      setMultiplier(currentMultiplier)
    }
  }, [open, currentMultiplier])

  const handleApply = () => {
    onApplyMultiplier(multiplier)
    onOpenChange(false)
  }

  const handleReset = () => {
    setMultiplier(1)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-bold">
              Adjust recipe yield
            </DialogTitle>
            <InfoTooltip content="Adjust ingredient quantities to fit how much you want to make. Your original recipe won't be changed." />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Prominently Featured Multiplier Display with PresetStepper */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Multiplier
            </span>

            <PresetStepper
              value={multiplier}
              onChange={setMultiplier}
              range={[0.25, 10]}
              step={0.25}
              symbol="×"
              presets={SHORTCUTS}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {multiplier !== 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer min-w-20"
            >
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

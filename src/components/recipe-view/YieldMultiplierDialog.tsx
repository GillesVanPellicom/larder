import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Stepper } from '@/components/ui/stepper'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { RotateCcw } from 'lucide-react'
import { formatGracefulNumber } from '@/lib/recipeMath'
import { cn } from 'cn'

export interface YieldMultiplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMultiplier: number
  onApplyMultiplier: (mult: number) => void
  baseYieldAmount?: number | string | null
  yieldUnit?: string | null
}

const SHORTCUTS = [
  { label: '¼×', multiplier: 0.25 },
  { label: '½×', multiplier: 0.5 },
  { label: '2×', multiplier: 2 },
  { label: '3×', multiplier: 3 },
  { label: '4×', multiplier: 4 },
]

export function YieldMultiplierDialog({
  open,
  onOpenChange,
  currentMultiplier,
  onApplyMultiplier,
  baseYieldAmount,
  yieldUnit,
}: YieldMultiplierDialogProps) {
  const parsedBase = typeof baseYieldAmount === 'number'
    ? baseYieldAmount
    : parseFloat(String(baseYieldAmount || ''))

  const hasNumericYield = !isNaN(parsedBase) && parsedBase > 0
  const baseYieldNum = hasNumericYield ? Math.round(parsedBase) : 1
  const unitLabel = yieldUnit?.trim() || (hasNumericYield ? 'servings' : '')

  const [targetYield, setTargetYield] = useState<number>(() => {
    if (hasNumericYield) {
      return Math.max(1, Math.round(baseYieldNum * currentMultiplier))
    }
    return currentMultiplier
  })

  useEffect(() => {
    if (open) {
      if (hasNumericYield) {
        setTargetYield(Math.max(1, Math.round(baseYieldNum * currentMultiplier)))
      } else {
        setTargetYield(currentMultiplier)
      }
    }
  }, [open, currentMultiplier, baseYieldNum, hasNumericYield])

  const handleApply = () => {
    const effectiveMultiplier = hasNumericYield
      ? targetYield / baseYieldNum
      : targetYield
    onApplyMultiplier(effectiveMultiplier)
    onOpenChange(false)
  }

  const handleReset = () => {
    if (hasNumericYield) {
      setTargetYield(baseYieldNum)
    } else {
      setTargetYield(1)
    }
  }

  const isModified = hasNumericYield
    ? targetYield !== baseYieldNum
    : Math.abs(targetYield - 1) > 0.005

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base font-bold">
              Adjust Yield
            </DialogTitle>
            <InfoTooltip content="Adjust ingredient quantities to fit how much you want to make. Your original recipe won't be changed. If the recipe is on the shopping list, the adjusted yield will be kept until removed from the list" />
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Stepper for Portion / Yield Amount */}
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {hasNumericYield ? unitLabel : 'Multiplier'}
            </span>

            <Stepper
              value={targetYield}
              onChange={(val) => {
                if (hasNumericYield) {
                  setTargetYield(Math.max(1, Math.round(val)))
                } else {
                  setTargetYield(Math.max(0.05, Math.round(val * 100) / 100))
                }
              }}
              min={hasNumericYield ? 1 : 0.25}
              step={hasNumericYield ? 1 : 0.25}
              symbol={hasNumericYield ? undefined : '×'}
              precision={hasNumericYield ? 0 : 2}
            />

            {/* Quick Action Preset Ratio Buttons */}
            <div className="grid grid-cols-5 gap-1.5 w-full max-w-xs pt-1">
              {SHORTCUTS.map((sc) => {
                const shortcutTarget = hasNumericYield
                  ? Math.max(1, Math.round(baseYieldNum * sc.multiplier))
                  : sc.multiplier
                const isActive = hasNumericYield
                  ? targetYield === shortcutTarget
                  : Math.abs(targetYield - sc.multiplier) < 0.005

                return (
                  <button
                    key={sc.multiplier}
                    type="button"
                    onClick={() => setTargetYield(shortcutTarget)}
                    className={cn(
                      'py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer text-center select-none',
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {sc.label}
                  </button>
                )
              })}
            </div>

            {/* Contextual Original & Multiplier Summary */}
            <div className="text-center text-xs text-muted-foreground font-medium pt-0.5">
              {hasNumericYield ? (
                <span>
                  Original: <strong className="text-foreground">{formatGracefulNumber(baseYieldNum)} {unitLabel}</strong>
                  {targetYield !== baseYieldNum && (
                    <span className="ml-2 font-mono text-amber-600 dark:text-amber-400 font-bold">
                      ({formatGracefulNumber(targetYield / baseYieldNum)}×)
                    </span>
                  )}
                </span>
              ) : (
                Math.abs(targetYield - 1) > 0.005 && (
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                    {formatGracefulNumber(targetYield)}×
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {isModified && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleApply}
              className="font-semibold bg-primary text-primary-foreground hover:opacity-90 cursor-pointer min-w-20"
            >
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

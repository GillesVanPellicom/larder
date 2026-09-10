import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Minus, Plus } from 'lucide-react'
import { cn } from 'cn'

export interface UnitStepperProps {
  amount: number | ''
  unit: string
  onAmountChange: (amount: number | '') => void
  onUnitChange: (unit: string) => void
  amountPlaceholder?: string
  unitPlaceholder?: string
  amountAriaLabel?: string
  unitAriaLabel?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  hasError?: boolean
  className?: string
}

export function UnitStepper({
  amount,
  unit,
  onAmountChange,
  onUnitChange,
  amountPlaceholder = '1',
  unitPlaceholder = 'unit',
  amountAriaLabel = 'Quantity amount',
  unitAriaLabel = 'Unit description',
  min = 1,
  max,
  step = 1,
  disabled = false,
  hasError = false,
  className = '',
}: UnitStepperProps) {
  const [draftAmount, setDraftAmount] = useState<string>(
    typeof amount === 'number' ? String(amount) : ''
  )

  useEffect(() => {
    setDraftAmount(typeof amount === 'number' ? String(amount) : '')
  }, [amount])

  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return
    const current = typeof amount === 'number' ? amount : min
    const delta = direction === 'up' ? step : -step
    let next = current + delta

    if (min !== undefined && next < min) next = min
    if (max !== undefined && next > max) next = max

    onAmountChange(next)
  }

  const handleBlur = () => {
    if (draftAmount.trim() === '') {
      onAmountChange('')
      return
    }
    const parsed = parseInt(draftAmount.trim(), 10)
    if (isNaN(parsed)) {
      onAmountChange(min)
    } else {
      let clamped = parsed
      if (min !== undefined && clamped < min) clamped = min
      if (max !== undefined && clamped > max) clamped = max
      onAmountChange(clamped)
    }
  }

  const currentNum = typeof amount === 'number' ? amount : min
  const isMinusDisabled = disabled || (min !== undefined && typeof amount === 'number' && currentNum <= min)
  const isPlusDisabled = disabled || (max !== undefined && typeof amount === 'number' && currentNum >= max)

  return (
    <div className={cn('flex items-center gap-1.5 w-full', className)}>
      {/* Unified Input Box (Amount + Vertical Divider + Unit) */}
      <div
        className={cn(
          'relative flex-1 min-w-0 flex items-center h-12 sm:h-9 rounded-lg border bg-transparent dark:bg-input/30 transition-colors overflow-hidden',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          hasError ? 'border-destructive ring-destructive/20 ring-2' : 'border-input'
        )}
      >
        {/* Quantity Number Input */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draftAmount}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value
            setDraftAmount(val)
            const num = parseInt(val, 10)
            if (!isNaN(num)) {
              onAmountChange(num)
            } else if (val.trim() === '') {
              onAmountChange('')
            }
          }}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur()
              e.currentTarget.blur()
            }
          }}
          aria-label={amountAriaLabel}
          placeholder={amountPlaceholder}
          className="w-14 sm:w-11 shrink-0 text-center font-medium font-mono text-base md:text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50 px-2 h-full"
        />

        {/* Divider */}
        <div
          className={cn(
            'self-stretch w-px shrink-0 mr-2.5 select-none',
            hasError ? 'bg-destructive/40' : 'bg-input'
          )}
        />

        {/* Editable Unit Input */}
        <input
          type="text"
          value={unit}
          disabled={disabled}
          onChange={(e) => onUnitChange(e.target.value)}
          placeholder={unitPlaceholder}
          aria-label={unitAriaLabel}
          className="flex-1 min-w-0 bg-transparent text-base md:text-sm font-normal text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50 pr-2.5 h-full"
        />
      </div>

      {/* Stepper Buttons */}
      <ButtonGroup className="shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleStep('down')}
          disabled={isMinusDisabled}
          className="h-12 w-12 sm:h-9 sm:w-9 cursor-pointer border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          title={step ? `Decrease by ${step}` : 'Decrease'}
        >
          <Minus className="h-4.5 w-4.5 sm:h-3.5 sm:w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleStep('up')}
          disabled={isPlusDisabled}
          className="h-12 w-12 sm:h-9 sm:w-9 cursor-pointer border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          title={step ? `Increase by ${step}` : 'Increase'}
        >
          <Plus className="h-4.5 w-4.5 sm:h-3.5 sm:w-3.5" />
        </Button>
      </ButtonGroup>
    </div>
  )
}

export const QuantityUnitStepper = UnitStepper

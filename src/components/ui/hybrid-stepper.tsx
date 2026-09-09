import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Minus, Plus } from 'lucide-react'
import { formatGracefulNumber } from '@/lib/recipeMath'
import { cn } from 'cn'

export interface HybridStepperProps {
  /** Controlled composite value string (e.g. "4 servings", "250 g", "30 min") */
  value: string
  /** Callback fired when either numeric quantity or unit changes */
  onChange: (value: string) => void
  /** Placeholder for quantity input */
  quantityPlaceholder?: string
  /** Placeholder for unit input */
  unitPlaceholder?: string
  /** Default unit fallback if string has no unit */
  defaultUnit?: string
  /** Minimum numeric value allowed. Defaults to 1. */
  min?: number
  /** Maximum numeric value allowed (optional) */
  max?: number
  /** Step increment/decrement amount. Defaults to 1. */
  step?: number
  /** Decimal precision for rounding step increments. Defaults to 2. */
  precision?: number
  /** Whether the stepper is disabled */
  disabled?: boolean
  /** Whether to apply error styling */
  hasError?: boolean
  /** Additional container classes */
  className?: string
  /** Accessible label for quantity input */
  quantityAriaLabel?: string
  /** Accessible label for unit input */
  unitAriaLabel?: string
}

function parseHybridValue(
  val: string,
  defaultUnit = ''
): { quantity: number; unit: string; rawQty: string } {
  if (!val || typeof val !== 'string') {
    return { quantity: 1, unit: defaultUnit, rawQty: '1' }
  }
  const match = val.trim().match(/^([\d]+(?:[.,]\d+)?)\s*(.*)$/)
  if (match) {
    const parsed = parseFloat(match[1].replace(',', '.'))
    return {
      quantity: isNaN(parsed) ? 1 : parsed,
      unit: match[2] !== undefined && match[2] !== '' ? match[2] : defaultUnit,
      rawQty: match[1],
    }
  }
  return { quantity: 1, unit: val.trim() || defaultUnit, rawQty: '1' }
}

export function HybridStepper({
  value,
  onChange,
  quantityPlaceholder = '1',
  unitPlaceholder = 'unit',
  defaultUnit = '',
  min = 1,
  max,
  step = 1,
  precision = 2,
  disabled = false,
  hasError = false,
  className = '',
  quantityAriaLabel,
  unitAriaLabel,
}: HybridStepperProps) {
  const parsed = parseHybridValue(value, defaultUnit)
  const [quantityDraft, setQuantityDraft] = useState(parsed.rawQty)
  const [unitDraft, setUnitDraft] = useState(parsed.unit)
  const lastEmittedRef = useRef(value)

  // Sync internal drafts when value changes externally
  useEffect(() => {
    if (value !== lastEmittedRef.current) {
      const p = parseHybridValue(value, defaultUnit)
      setQuantityDraft(p.rawQty)
      setUnitDraft(p.unit)
      lastEmittedRef.current = value
    }
  }, [value, defaultUnit])

  const emitChange = (qtyStr: string, unitStr: string) => {
    const trimmedUnit = unitStr.trim()
    const trimmedQty = qtyStr.trim()
    const result = trimmedUnit ? `${trimmedQty} ${trimmedUnit}` : trimmedQty
    lastEmittedRef.current = result
    onChange(result)
  }

  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return
    const currentNum = parseFloat(quantityDraft.replace(',', '.')) || min
    const delta = direction === 'up' ? step : -step
    const factor = Math.pow(10, precision)
    let nextNum = Math.round((currentNum + delta) * factor) / factor

    if (min !== undefined && nextNum < min) nextNum = min
    if (max !== undefined && nextNum > max) nextNum = max

    const formatted = formatGracefulNumber(nextNum)
    setQuantityDraft(formatted)
    emitChange(formatted, unitDraft)
  }

  const handleQuantityBlur = () => {
    const parsedNum = parseFloat(quantityDraft.trim().replace(',', '.'))
    if (isNaN(parsedNum)) {
      const fallback = formatGracefulNumber(min)
      setQuantityDraft(fallback)
      emitChange(fallback, unitDraft)
    } else {
      let clamped = parsedNum
      if (min !== undefined && clamped < min) clamped = min
      if (max !== undefined && clamped > max) clamped = max
      const formatted = formatGracefulNumber(clamped)
      setQuantityDraft(formatted)
      emitChange(formatted, unitDraft)
    }
  }

  const currentParsedNum = parseFloat(quantityDraft.replace(',', '.')) || min
  const isMinusDisabled = disabled || (min !== undefined && currentParsedNum <= min)
  const isPlusDisabled = disabled || (max !== undefined && currentParsedNum >= max)

  return (
    <div className={cn('flex items-center gap-1.5 w-full', className)}>
      {/* Unified Input Box (Quantity + Top-to-Bottom Divider + Unit) */}
      <div
        className={cn(
          'relative flex-1 min-w-0 flex items-center h-10 sm:h-9 rounded-lg border bg-transparent transition-colors overflow-hidden',
          'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
          hasError ? 'border-destructive ring-destructive/20 ring-2' : 'border-input'
        )}
      >
        {/* Quantity Number Input */}
        <input
          type="text"
          inputMode="decimal"
          value={quantityDraft}
          disabled={disabled}
          onChange={(e) => {
            const nextQty = e.target.value
            setQuantityDraft(nextQty)
            emitChange(nextQty, unitDraft)
          }}
          onBlur={handleQuantityBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleQuantityBlur()
              e.currentTarget.blur()
            }
          }}
          aria-label={quantityAriaLabel || 'Quantity'}
          placeholder={quantityPlaceholder}
          className="w-11 sm:w-10 shrink-0 text-center font-medium font-mono text-base md:text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50 px-2 h-full"
        />

        {/* Top-to-bottom divider styled identically to the border with extra right margin */}
        <div
          className={cn(
            'self-stretch w-px shrink-0 mr-2.5 select-none',
            hasError ? 'bg-destructive/40' : 'bg-input'
          )}
        />

        {/* Editable Unit Input */}
        <input
          type="text"
          value={unitDraft}
          disabled={disabled}
          onChange={(e) => {
            const nextUnit = e.target.value
            setUnitDraft(nextUnit)
            emitChange(quantityDraft, nextUnit)
          }}
          placeholder={unitPlaceholder}
          aria-label={unitAriaLabel || 'Unit description'}
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
          className="h-10 w-10 sm:h-9 sm:w-9 cursor-pointer border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          title={step ? `Decrease by ${step}` : 'Decrease'}
        >
          <Minus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => handleStep('up')}
          disabled={isPlusDisabled}
          className="h-10 w-10 sm:h-9 sm:w-9 cursor-pointer border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          title={step ? `Increase by ${step}` : 'Increase'}
        >
          <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </Button>
      </ButtonGroup>
    </div>
  )
}

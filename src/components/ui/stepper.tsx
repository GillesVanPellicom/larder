import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Minus, Plus } from 'lucide-react'
import { formatGracefulNumber } from '@/lib/recipeMath'
import { cn } from 'cn'

export interface StepperProps {
  /** The controlled numeric value */
  value: number
  /** Callback fired whenever the value changes (via step, input edit, or clamp) */
  onChange: (value: number) => void
  /**
   * Allowed range as [min, max] or { min?: number, max?: number }.
   * Defaults to undefined (no range restriction).
   */
  range?: [number, number] | { min?: number; max?: number }
  /** Explicit min shortcut (alternative to range) */
  min?: number
  /** Explicit max shortcut (alternative to range) */
  max?: number
  /** Step increment/decrement amount. Defaults to 1. */
  step?: number
  /** Optional display symbol affixed to the number (e.g. '×', '%') */
  symbol?: React.ReactNode
  /** Additional container classes */
  className?: string
  /** Whether the stepper is disabled */
  disabled?: boolean
  /** Decimal precision for rounding step increments and parsing. Defaults to 2. */
  precision?: number
  /** Accessible label */
  ariaLabel?: string
  /** Visual variant: 'default' (large modal style) or 'small' (h-8 field style with + - in button group on right) */
  variant?: 'default' | 'small'
}

export function Stepper({
  value,
  onChange,
  range,
  min,
  max,
  step = 1,
  symbol,
  className = '',
  disabled = false,
  precision = 2,
  ariaLabel,
  variant = 'default',
}: StepperProps) {
  const resolvedMin = range
    ? Array.isArray(range)
      ? range[0]
      : range.min
    : min
  const resolvedMax = range
    ? Array.isArray(range)
      ? range[1]
      : range.max
    : max

  const clamp = React.useCallback(
    (val: number): number => {
      let result = val
      if (resolvedMin !== undefined && result < resolvedMin) {
        result = resolvedMin
      }
      if (resolvedMax !== undefined && result > resolvedMax) {
        result = resolvedMax
      }
      return result
    },
    [resolvedMin, resolvedMax]
  )

  // Ensure effective value is always clamped if a range is set
  const effectiveValue = clamp(value)

  // Stepping logic
  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return
    const delta = direction === 'up' ? step : -step
    const factor = Math.pow(10, precision)
    const next = Math.round((effectiveValue + delta) * factor) / factor
    const clamped = clamp(next)
    onChange(clamped)
  }

  const isMinusDisabled = disabled || (resolvedMin !== undefined && effectiveValue <= resolvedMin)
  const isPlusDisabled = disabled || (resolvedMax !== undefined && effectiveValue >= resolvedMax)

  // Click-to-edit inline state
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleStartEditing = () => {
    if (disabled) return
    setDraftValue(formatGracefulNumber(effectiveValue))
    setIsEditing(true)
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleCommitEdit = () => {
    setIsEditing(false)
    const trimmed = draftValue.trim().replace(',', '.')
    const parsed = parseFloat(trimmed)
    if (isNaN(parsed)) {
      setDraftValue(formatGracefulNumber(effectiveValue))
      return
    }
    const factor = Math.pow(10, precision)
    const rounded = Math.round(parsed * factor) / factor
    const clamped = clamp(rounded)
    onChange(clamped)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setDraftValue(formatGracefulNumber(effectiveValue))
  }

  if (variant === 'small') {
    return (
      <div className={cn('flex items-center gap-1.5 w-full', className)}>
        <div className="relative flex-1 min-w-[4rem] sm:min-w-0 flex items-center h-12 sm:h-9 rounded-lg border border-input bg-transparent dark:bg-input/30 px-3.5 sm:px-3 py-2 sm:py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={isEditing ? draftValue : formatGracefulNumber(effectiveValue)}
            onFocus={handleStartEditing}
            onChange={(e) => setDraftValue(e.target.value)}
            onBlur={handleCommitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCommitEdit()
                e.currentTarget.blur()
              } else if (e.key === 'Escape') {
                handleCancelEdit()
                e.currentTarget.blur()
              }
            }}
            disabled={disabled}
            aria-label={ariaLabel || `Value ${formatGracefulNumber(effectiveValue)}`}
            className="w-full min-w-0 bg-transparent text-base md:text-sm font-medium outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          />
          {symbol && (
            <span className="text-xs text-muted-foreground font-medium ml-1 select-none pointer-events-none shrink-0">
              {symbol}
            </span>
          )}
        </div>

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

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      {/* Minus Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleStep('down')}
        disabled={isMinusDisabled}
        className="h-12 w-12 sm:h-11 sm:w-11 rounded-2xl cursor-pointer border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        title={step ? `Decrease by ${step}` : 'Decrease'}
      >
        <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>

      {/* Number Display or Inline Input */}
      <div className="h-12 sm:h-11 min-w-32 flex items-center justify-center text-center">
        {isEditing ? (
          <div className="h-12 sm:h-11 flex items-center justify-center">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onBlur={handleCommitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommitEdit()
                } else if (e.key === 'Escape') {
                  handleCancelEdit()
                }
              }}
              style={{ width: `${Math.max(3, draftValue.length + 1)}ch` }}
              className="h-12 sm:h-11 min-w-16 max-w-44 text-4xl font-extrabold tracking-tight text-foreground font-mono text-center bg-background border border-primary/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 px-2 py-0 leading-none"
            />
            {symbol && (
              <span
                className={cn(
                  'select-none leading-none ml-1.5',
                  typeof symbol === 'string' && symbol.length > 1
                    ? 'text-sm sm:text-base font-semibold text-muted-foreground ml-2'
                    : 'text-2xl font-bold text-amber-500'
                )}
              >
                {symbol}
              </span>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEditing}
            disabled={disabled}
            className="group h-12 sm:h-11 flex items-center justify-center px-3 rounded-xl cursor-pointer hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Click to edit number"
            aria-label={ariaLabel || `Value ${formatGracefulNumber(effectiveValue)}, click to edit`}
          >
            <span className="text-4xl font-extrabold tracking-tight text-foreground font-mono leading-none group-hover:opacity-80 transition-opacity">
              {formatGracefulNumber(effectiveValue)}
            </span>
            {symbol && (
              <span
                className={cn(
                  'select-none leading-none ml-1.5',
                  typeof symbol === 'string' && symbol.length > 1
                    ? 'text-sm sm:text-base font-semibold text-muted-foreground ml-2'
                    : 'text-2xl font-bold text-amber-500'
                )}
              >
                {symbol}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Plus Button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => handleStep('up')}
        disabled={isPlusDisabled}
        className="h-12 w-12 sm:h-11 sm:w-11 rounded-2xl cursor-pointer border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        title={step ? `Increase by ${step}` : 'Increase'}
      >
        <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
      </Button>
    </div>
  )
}

export interface StepperPreset {
  label: string
  value: number
}

export interface PresetStepperProps extends StepperProps {
  /**
   * Quick preset shortcut buttons.
   * Can be `{ label: string, value: number }` or a number.
   */
  presets?: Array<StepperPreset | number>
  /** Whether clicking an already active preset clears/toggles it */
  allowClearPreset?: boolean
  /** Callback fired when a preset is cleared */
  onClear?: () => void
  /** Container class for the presets group */
  presetsClassName?: string
}

export function PresetStepper({
  presets = [],
  allowClearPreset = false,
  onClear,
  presetsClassName = '',
  className = '',
  ...stepperProps
}: PresetStepperProps) {
  const normalizedPresets: StepperPreset[] = presets.map((p) =>
    typeof p === 'number'
      ? {
          label: `${formatGracefulNumber(p)}${stepperProps.symbol ? ` ${stepperProps.symbol}` : ''}`,
          value: p,
        }
      : p
  )

  const handlePresetClick = (presetValue: number) => {
    if (allowClearPreset && Math.abs(stepperProps.value - presetValue) < 0.001) {
      if (onClear) {
        onClear()
      } else {
        stepperProps.onChange(0)
      }
      return
    }
    stepperProps.onChange(presetValue)
  }

  const isDefaultVariant = (stepperProps.variant ?? 'default') === 'default'

  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      <div className={cn('w-full', isDefaultVariant ? 'flex justify-center items-center' : '')}>
        <Stepper {...stepperProps} />
      </div>

      {normalizedPresets.length > 0 && (
        <div
          className={cn(
            'grid gap-1.5 w-full',
            normalizedPresets.length === 5 ? 'grid-cols-5' : 'grid-cols-4 sm:grid-cols-5',
            presetsClassName
          )}
        >
          {normalizedPresets.map((sc) => {
            const isActive = Math.abs(stepperProps.value - sc.value) < 0.001
            return (
              <button
                key={sc.value}
                type="button"
                onClick={() => handlePresetClick(sc.value)}
                disabled={stepperProps.disabled}
                className={cn(
                  'px-1.5 py-2.5 sm:py-1.5 min-h-11 sm:min-h-0 rounded-xl text-sm sm:text-xs font-bold border transition-all cursor-pointer text-center select-none disabled:opacity-50 disabled:cursor-not-allowed',
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
      )}
    </div>
  )
}

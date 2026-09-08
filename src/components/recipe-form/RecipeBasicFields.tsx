import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Stepper } from '@/components/ui/stepper'
import type { MandatoryFieldsConfig } from '@/shared/types'
import { Clock } from 'lucide-react'

interface RecipeBasicFieldsProps {
  title: string
  onTitleChange: (val: string) => void
  description: string
  onDescriptionChange: (val: string) => void
  prepTimeMinutes: number | ''
  onPrepTimeChange: (val: number | '') => void
  cookTimeMinutes: number | ''
  onCookTimeChange: (val: number | '') => void
  calculatedTotalTime: number
  yieldAmount: string
  onYieldChange: (val: string) => void
  mandatory: MandatoryFieldsConfig
  fieldErrors: Record<string, string>
  onClearFieldError: (field: string) => void
  name?: string
}

export function RecipeBasicFields({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  prepTimeMinutes,
  onPrepTimeChange,
  cookTimeMinutes,
  onCookTimeChange,
  calculatedTotalTime,
  yieldAmount,
  onYieldChange,
  mandatory,
  fieldErrors,
  onClearFieldError,
  name,
}: RecipeBasicFieldsProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {name || 'Recipe Details'}
        </h2>
        <InfoTooltip content="Primary details including recipe name, description, duration, and yield." />
      </div>

      <div className="space-y-4">
        {/* Recipe Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Recipe Title <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="e.g. Classic Beef Bourguignon"
            value={title}
            onChange={(e) => {
              onTitleChange(e.target.value)
              if (fieldErrors.title) onClearFieldError('title')
            }}
            className={fieldErrors.title ? 'border-destructive ring-destructive/20 ring-2' : ''}
          />
          {fieldErrors.title && (
            <span className="text-[11px] text-destructive">{fieldErrors.title}</span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Description {mandatory.description && <span className="text-destructive">*</span>}
          </label>
          <Textarea
            rows={3}
            placeholder="A short summary or backstory for this dish..."
            value={description}
            onChange={(e) => {
              onDescriptionChange(e.target.value)
              if (fieldErrors.description) onClearFieldError('description')
            }}
            className={fieldErrors.description ? 'border-destructive ring-destructive/20 ring-2' : ''}
          />
          {fieldErrors.description && (
            <span className="text-[11px] text-destructive">{fieldErrors.description}</span>
          )}
        </div>

        {/* Times & Yield Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          {/* Prep Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Prep Time {mandatory.prep_time_minutes && <span className="text-destructive">*</span>}
            </label>
            <Stepper
              variant="small"
              value={typeof prepTimeMinutes === 'number' ? prepTimeMinutes : 0}
              onChange={(val) => {
                onPrepTimeChange(val)
                if (fieldErrors.prep_time_minutes) onClearFieldError('prep_time_minutes')
              }}
              min={0}
              step={5}
              symbol="min"
              ariaLabel="Prep time in minutes"
              className={fieldErrors.prep_time_minutes ? 'border-destructive ring-destructive/20 ring-2 rounded-lg' : ''}
            />
            {fieldErrors.prep_time_minutes && (
              <span className="text-[11px] text-destructive">{fieldErrors.prep_time_minutes}</span>
            )}
          </div>

          {/* Cook Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Cook Time {mandatory.cook_time_minutes && <span className="text-destructive">*</span>}
            </label>
            <Stepper
              variant="small"
              value={typeof cookTimeMinutes === 'number' ? cookTimeMinutes : 0}
              onChange={(val) => {
                onCookTimeChange(val)
                if (fieldErrors.cook_time_minutes) onClearFieldError('cook_time_minutes')
              }}
              min={0}
              step={5}
              symbol="min"
              ariaLabel="Cook time in minutes"
              className={fieldErrors.cook_time_minutes ? 'border-destructive ring-destructive/20 ring-2 rounded-lg' : ''}
            />
            {fieldErrors.cook_time_minutes && (
              <span className="text-[11px] text-destructive">{fieldErrors.cook_time_minutes}</span>
            )}
          </div>

          {/* Total Time Display */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Total Time</span>
              <span className="text-[10px] text-muted-foreground font-normal">(Calculated)</span>
            </label>
            <div className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 text-xs font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>{calculatedTotalTime > 0 ? `${calculatedTotalTime} min` : '0 min'}</span>
            </div>
          </div>

          {/* Yield */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Yield {mandatory.yield_amount && <span className="text-destructive">*</span>}
            </label>
            {(() => {
              const match = (yieldAmount || '').match(/^(\d+)\s*(.*)$/)
              const yieldNum = match ? parseInt(match[1], 10) || 4 : parseInt(yieldAmount, 10) || 4
              const yieldUnit = match && match[2].trim() ? match[2].trim() : 'servings'

              return (
                <Stepper
                  variant="small"
                  value={yieldNum}
                  onChange={(val) => {
                    onYieldChange(`${val} ${yieldUnit}`)
                    if (fieldErrors.yield_amount) onClearFieldError('yield_amount')
                  }}
                  min={1}
                  step={1}
                  symbol={yieldUnit}
                  ariaLabel="Yield quantity"
                  className={fieldErrors.yield_amount ? 'border-destructive ring-destructive/20 ring-2 rounded-lg' : ''}
                />
              )
            })()}
            {fieldErrors.yield_amount && (
              <span className="text-[11px] text-destructive">{fieldErrors.yield_amount}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

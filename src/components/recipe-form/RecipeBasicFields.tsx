import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Stepper } from '@/components/ui/stepper'
import type { MandatoryFieldsConfig, TimeTrackingMode } from '@/shared/types'

interface RecipeBasicFieldsProps {
  title: string
  onTitleChange: (val: string) => void
  description: string
  onDescriptionChange: (val: string) => void
  prepTimeMinutes: number | ''
  onPrepTimeChange: (val: number | '') => void
  cookTimeMinutes: number | ''
  onCookTimeChange: (val: number | '') => void
  yieldAmount: string
  onYieldChange: (val: string) => void
  mandatory: MandatoryFieldsConfig
  fieldErrors: Record<string, string>
  onClearFieldError: (field: string) => void
  timeTrackingMode?: TimeTrackingMode
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
  yieldAmount,
  onYieldChange,
  mandatory,
  fieldErrors,
  onClearFieldError,
  timeTrackingMode = 'prep_and_cook',
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
        <div data-field="title" className="space-y-1.5">
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
        <div data-field="description" className="space-y-1.5">
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
        <div
          className={`grid grid-cols-1 ${
            timeTrackingMode === 'prep_and_cook'
              ? 'sm:grid-cols-3'
              : timeTrackingMode === 'total_only'
              ? 'sm:grid-cols-2'
              : 'sm:grid-cols-1 max-w-xs'
          } gap-4 pt-1`}
        >
          {/* Prep Time / Total Time Stepper */}
          {timeTrackingMode === 'total_only' && (
            <div data-field="prep_time_minutes" className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Total Time {mandatory.prep_time_minutes && <span className="text-destructive">*</span>}
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
                ariaLabel="Total time in minutes"
                className={fieldErrors.prep_time_minutes ? 'border-destructive ring-destructive/20 ring-2 rounded-lg' : ''}
              />
              {fieldErrors.prep_time_minutes && (
                <span className="text-[11px] text-destructive">{fieldErrors.prep_time_minutes}</span>
              )}
            </div>
          )}

          {timeTrackingMode === 'prep_and_cook' && (
            <>
              <div data-field="prep_time_minutes" className="space-y-1.5">
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

              <div data-field="cook_time_minutes" className="space-y-1.5">
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
            </>
          )}

          {/* Yield */}
          <div data-field="yield_amount" className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Yield {mandatory.yield_amount && <span className="text-destructive">*</span>}
            </label>
            {(() => {
              const match = (yieldAmount || '').match(/^([\d.,]+)\s*(.*)$/)
              const yieldNum = match ? parseFloat(match[1].replace(',', '.')) || 1 : (parseInt(yieldAmount, 10) || 4)
              const yieldUnit = match ? match[2] : (yieldAmount ? '' : 'servings')

              return (
                <div className="flex items-center gap-2">
                  <div className="w-28 sm:w-32 shrink-0">
                    <Stepper
                      variant="small"
                      value={yieldNum}
                      onChange={(val) => {
                        const trimmedUnit = yieldUnit.trim()
                        onYieldChange(trimmedUnit ? `${val} ${trimmedUnit}` : `${val}`)
                        if (fieldErrors.yield_amount) onClearFieldError('yield_amount')
                      }}
                      min={1}
                      step={1}
                      ariaLabel="Yield quantity"
                      className={fieldErrors.yield_amount ? 'border-destructive ring-destructive/20 ring-2 rounded-lg' : ''}
                    />
                  </div>
                  <Input
                    placeholder="Unit (e.g. servings, cookies, l)"
                    value={yieldUnit}
                    onChange={(e) => {
                      const newUnit = e.target.value
                      onYieldChange(newUnit ? `${yieldNum} ${newUnit}` : `${yieldNum}`)
                      if (fieldErrors.yield_amount) onClearFieldError('yield_amount')
                    }}
                    className={`flex-1 h-10 sm:h-9 text-base md:text-sm ${
                      fieldErrors.yield_amount ? 'border-destructive ring-destructive/20 ring-2' : ''
                    }`}
                  />
                </div>
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

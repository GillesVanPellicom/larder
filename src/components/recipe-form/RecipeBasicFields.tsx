import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { Stepper } from '@/components/ui/stepper'
import { YieldStepper } from './YieldStepper'
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
  sourceUrl: string
  onSourceUrlChange: (val: string) => void
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
  sourceUrl,
  onSourceUrlChange,
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
        {/* Title */}
        <div data-field="title" className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Title <span className="text-destructive">*</span>
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

        {/* Times & Yield (Desktop: 30% Prep, 30% Cook, 40% Yield) */}
        <div
          className={`grid grid-cols-1 ${
            timeTrackingMode === 'prep_and_cook'
              ? 'sm:grid-cols-[3fr_3fr_4fr]'
              : timeTrackingMode === 'total_only'
              ? 'sm:grid-cols-2'
              : 'max-w-sm'
          } gap-4 pt-1 w-full`}
        >
          {/* Total Time Stepper */}
          {timeTrackingMode === 'total_only' && (
            <div data-field="prep_time_minutes" className="space-y-1.5 min-w-0 w-full">
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
              {/* Prep time: 30% */}
              <div data-field="prep_time_minutes" className="space-y-1.5 min-w-0 w-full">
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

              {/* Cook time: 30% */}
              <div data-field="cook_time_minutes" className="space-y-1.5 min-w-0 w-full">
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

          {/* Yield: 40% (Desktop) */}
          <div data-field="yield_amount" className="space-y-1.5 min-w-0 w-full">
            <label className="text-xs font-semibold text-foreground">
              Yield {mandatory.yield_amount && <span className="text-destructive">*</span>}
            </label>
            <YieldStepper
              value={yieldAmount}
              onChange={(val) => {
                onYieldChange(val)
                if (fieldErrors.yield_amount) onClearFieldError('yield_amount')
              }}
              hasError={Boolean(fieldErrors.yield_amount)}
            />
            {fieldErrors.yield_amount && (
              <span className="text-[11px] text-destructive">{fieldErrors.yield_amount}</span>
            )}
          </div>
        </div>

        {/* Originally adapted from */}
        <div data-field="source_url" className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">
            Originally adapted from {mandatory.source_url && <span className="text-destructive">*</span>}
          </label>
          <Input
            placeholder="e.g. Grandma's recipe, https://cooking.nytimes.com/..."
            value={sourceUrl}
            onChange={(e) => {
              onSourceUrlChange(e.target.value)
              if (fieldErrors.source_url) onClearFieldError('source_url')
            }}
            className={fieldErrors.source_url ? 'border-destructive ring-destructive/20 ring-2' : ''}
          />
          {fieldErrors.source_url && (
            <span className="text-[11px] text-destructive">{fieldErrors.source_url}</span>
          )}
        </div>
      </div>
    </div>
  )
}

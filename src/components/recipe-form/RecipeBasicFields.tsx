import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MandatoryFieldsConfig } from '@/shared/types'
import { Clock, Info } from 'lucide-react'

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
  imageUrl: string
  onImageUrlChange: (val: string) => void
  mandatory: MandatoryFieldsConfig
  fieldErrors: Record<string, string>
  onClearFieldError: (field: string) => void
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
  imageUrl,
  onImageUrlChange,
  mandatory,
  fieldErrors,
  onClearFieldError,
}: RecipeBasicFieldsProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-xs">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Basic Information
        </h2>
        <Tooltip>
          <TooltipTrigger
            render={
              <button type="button" className="p-0.5 text-muted-foreground hover:text-foreground cursor-help">
                <Info className="h-3.5 w-3.5" />
              </button>
            }
          />
          <TooltipContent>
            Primary details including recipe name, description, duration, and yield.
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-4">
        {/* Recipe Title */}
        <div className="space-y-1">
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
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Description {mandatory.description && <span className="text-destructive">*</span>}
          </label>
          <Textarea
            rows={2}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Prep Time (min) {mandatory.prep_time_minutes && <span className="text-destructive">*</span>}
            </label>
            <Input
              type="number"
              min="0"
              placeholder="15"
              value={prepTimeMinutes}
              onChange={(e) => {
                onPrepTimeChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))
                if (fieldErrors.prep_time_minutes) onClearFieldError('prep_time_minutes')
              }}
              className={fieldErrors.prep_time_minutes ? 'border-destructive ring-destructive/20 ring-2' : ''}
            />
            {fieldErrors.prep_time_minutes && (
              <span className="text-[11px] text-destructive">{fieldErrors.prep_time_minutes}</span>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Cook Time (min) {mandatory.cook_time_minutes && <span className="text-destructive">*</span>}
            </label>
            <Input
              type="number"
              min="0"
              placeholder="45"
              value={cookTimeMinutes}
              onChange={(e) => {
                onCookTimeChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))
                if (fieldErrors.cook_time_minutes) onClearFieldError('cook_time_minutes')
              }}
              className={fieldErrors.cook_time_minutes ? 'border-destructive ring-destructive/20 ring-2' : ''}
            />
            {fieldErrors.cook_time_minutes && (
              <span className="text-[11px] text-destructive">{fieldErrors.cook_time_minutes}</span>
            )}
          </div>

          {/* Calculated Total Time Display */}
          <div className="space-y-1">
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Yield {mandatory.yield_amount && <span className="text-destructive">*</span>}
            </label>
            <Input
              placeholder="4 servings"
              value={yieldAmount}
              onChange={(e) => {
                onYieldChange(e.target.value)
                if (fieldErrors.yield_amount) onClearFieldError('yield_amount')
              }}
              className={fieldErrors.yield_amount ? 'border-destructive ring-destructive/20 ring-2' : ''}
            />
            {fieldErrors.yield_amount && (
              <span className="text-[11px] text-destructive">{fieldErrors.yield_amount}</span>
            )}
          </div>
        </div>

        {/* Image URL */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Image URL {mandatory.image_url && <span className="text-destructive">*</span>}
          </label>
          <Input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={imageUrl}
            onChange={(e) => {
              onImageUrlChange(e.target.value)
              if (fieldErrors.image_url) onClearFieldError('image_url')
            }}
            className={fieldErrors.image_url ? 'border-destructive ring-destructive/20 ring-2' : ''}
          />
          {fieldErrors.image_url && (
            <span className="text-[11px] text-destructive">{fieldErrors.image_url}</span>
          )}
        </div>
      </div>
    </div>
  )
}

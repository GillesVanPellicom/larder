import * as React from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from 'cn'
import { useIsMobile } from '@/hooks/useIsMobile'

export interface IngredientRowProps {
  name: React.ReactNode
  quantity?: React.ReactNode
  isChecked?: boolean
  isPartial?: boolean
  onClick?: () => void
  leading?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  secondary?: React.ReactNode
  isMobile?: boolean
  className?: string
  dimmed?: boolean
  showCheckbox?: boolean
}

export function IngredientRow({
  name,
  quantity,
  isChecked = false,
  isPartial = false,
  onClick,
  leading,
  badge,
  actions,
  secondary,
  isMobile: isMobileProp,
  className,
  dimmed = false,
  showCheckbox = true,
}: IngredientRowProps) {
  const isMobileHook = useIsMobile()
  const isMobile = isMobileProp ?? isMobileHook

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-3.5 py-3.5 sm:py-3 px-3 sm:px-4 rounded-xl cursor-pointer transition-colors select-none hover:bg-muted/40 min-h-[3rem]',
        isChecked ? 'text-muted-foreground opacity-70' : 'text-foreground',
        dimmed && 'opacity-40 hover:opacity-75 bg-muted/15 text-muted-foreground',
        className
      )}
    >
      {/* Leading indicator or Checkbox */}
      {leading ? (
        leading
      ) : showCheckbox ? (
        <div
          className={cn(
            'mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors border',
            isChecked || isPartial
              ? 'bg-primary border-primary text-primary-foreground'
              : 'border-border bg-card hover:border-primary/50'
          )}
        >
          {isChecked ? (
            <Check className="h-3.5 w-3.5 stroke-[3]" />
          ) : isPartial ? (
            <Minus className="h-3.5 w-3.5 stroke-[3]" />
          ) : null}
        </div>
      ) : null}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {isMobile ? (
          /* Mobile View: Quantity stacked directly beneath the name */
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  title={typeof name === 'string' ? name : undefined}
                  className={cn(
                    'text-sm font-medium break-words leading-snug',
                    isChecked && 'line-through'
                  )}
                >
                  {name}
                </span>
                {badge}
              </div>
              {quantity && (
                <div
                  className={cn(
                    'text-xs font-mono font-medium mt-0.5 break-words',
                    isChecked ? 'text-muted-foreground' : 'text-muted-foreground/90'
                  )}
                >
                  {quantity}
                </div>
              )}
            </div>
            {actions && <div className="shrink-0 ml-1 self-center">{actions}</div>}
          </div>
        ) : (
          /* Desktop View: Quantity aligned horizontally to the right */
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-2 min-w-0">
              <span
                title={typeof name === 'string' ? name : undefined}
                className={cn(
                  'text-sm sm:text-[15px] font-medium break-words leading-snug',
                  isChecked && 'line-through'
                )}
              >
                {name}
              </span>
              {badge}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {quantity && (
                <span
                  className={cn(
                    'text-xs sm:text-sm font-mono font-medium',
                    isChecked ? 'text-muted-foreground' : 'text-foreground'
                  )}
                >
                  {quantity}
                </span>
              )}
              {actions}
            </div>
          </div>
        )}

        {/* Optional Secondary Content (e.g. Recipe Instances Breakdown) */}
        {secondary && <div className="mt-1">{secondary}</div>}
      </div>
    </div>
  )
}

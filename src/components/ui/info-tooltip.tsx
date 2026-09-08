import type React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from 'cn'

export interface InfoTooltipProps {
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
  iconClassName?: string
  align?: 'start' | 'center' | 'end'
}

/**
 * Standard reusable Info Icon with Tooltip component.
 * Used across the application instead of textual subheaders / subtitles for explanatory notes.
 */
export function InfoTooltip({
  content,
  side = 'top',
  align = 'center',
  className,
  iconClassName,
}: InfoTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center p-0.5 text-muted-foreground hover:text-foreground cursor-help transition-colors rounded shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              className
            )}
            title="More information"
          >
            <Info className={cn('h-3.5 w-3.5', iconClassName)} />
          </button>
        }
      />
      <TooltipContent side={side} align={align} className="text-xs max-w-xs font-normal">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

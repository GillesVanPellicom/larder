import type React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from 'cn'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors rounded shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring touch-manipulation',
              isMobile ? 'h-8 w-8 -my-1.5 -mx-1 p-1' : 'p-0.5',
              className
            )}
            title="More information"
            aria-label="More information"
          >
            <Info className={cn(isMobile ? 'h-4 w-4' : 'h-3.5 w-3.5', iconClassName)} />
          </button>
        }
      />
      <TooltipContent side={side} align={align} className="text-xs max-w-xs font-normal">
        {content}
      </TooltipContent>
    </Tooltip>
  )
}

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export const fabWrapperPositions: Record<
  FabPosition,
  { container: string; inner: string }
> = {
  'bottom-right': {
    container: 'fixed inset-x-0 bottom-0 pointer-events-none z-40 pb-6 sm:pb-8',
    inner: 'mx-auto w-full max-w-7xl px-4 sm:px-6 flex justify-end',
  },
  'bottom-left': {
    container: 'fixed inset-x-0 bottom-0 pointer-events-none z-40 pb-6 sm:pb-8',
    inner: 'mx-auto w-full max-w-7xl px-4 sm:px-6 flex justify-start',
  },
  'bottom-center': {
    container: 'fixed inset-x-0 bottom-0 pointer-events-none z-40 pb-6 sm:pb-8',
    inner: 'mx-auto w-full max-w-7xl px-4 sm:px-6 flex justify-center',
  },
  'top-right': {
    container: 'fixed inset-x-0 top-0 pointer-events-none z-40 pt-5 sm:pt-6',
    inner: 'mx-auto w-full max-w-7xl px-4 sm:px-6 flex justify-end',
  },
  'top-left': {
    container: 'fixed inset-x-0 top-0 pointer-events-none z-40 pt-5 sm:pt-6',
    inner: 'mx-auto w-full max-w-7xl px-4 sm:px-6 flex justify-start',
  },
  'top-center': {
    container: 'fixed inset-x-0 top-0 pointer-events-none z-40 pt-5 sm:pt-6',
    inner: 'mx-auto w-full max-w-7xl px-4 sm:px-6 flex justify-center',
  },
}

export type FabPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left'
  | 'top-center'

const fabVariants = cva(
  'pointer-events-auto flex items-center justify-center aspect-square rounded-2xl transition-all duration-200 select-none cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95 hover:scale-105',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md hover:shadow-lg border border-primary-foreground/10',
        outline:
          'border-2 border-border bg-card/90 text-foreground backdrop-blur-md shadow-md hover:shadow-lg hover:bg-muted hover:border-foreground/30',
        secondary:
          'bg-secondary text-secondary-foreground shadow-md hover:shadow-lg border border-border/40',
        ghost:
          'bg-card/85 text-foreground backdrop-blur-md shadow-sm hover:shadow-md hover:bg-muted',
        destructive:
          'bg-destructive text-white shadow-md hover:shadow-lg',
      },
      size: {
        default:
          'h-14 w-14 sm:h-16 sm:w-16 [&_svg]:size-7 sm:[&_svg]:size-8 [&_svg]:stroke-[2.5] [&_svg]:shrink-0',
        sm: 'h-12 w-12 sm:h-13 sm:w-13 [&_svg]:size-6 [&_svg]:stroke-[2.25] [&_svg]:shrink-0',
        lg: 'h-16 w-16 sm:h-20 sm:w-20 rounded-3xl [&_svg]:size-9 sm:[&_svg]:size-10 [&_svg]:stroke-[2.5] [&_svg]:shrink-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface FloatingActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof fabVariants> {
  icon: React.ReactNode
  position?: FabPosition
  tooltip?: React.ReactNode
  label?: string
  containerClassName?: string
}

export const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  FloatingActionButtonProps
>(
  (
    {
      icon,
      position = 'bottom-right',
      variant = 'default',
      size = 'default',
      tooltip,
      label,
      title,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const tooltipNode = tooltip ?? label ?? title
    const positionConfig = fabWrapperPositions[position]
    const tooltipSide =
      position.includes('top') ? 'bottom' : position.includes('right') ? 'left' : 'right'

    const ariaLabel =
      label || title || (typeof tooltip === 'string' ? tooltip : undefined)

    const buttonElement = (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        className={cn(fabVariants({ variant, size }), className)}
        {...props}
      >
        {icon}
      </button>
    )

    const renderedButton = tooltipNode ? (
      <Tooltip>
        <TooltipTrigger render={buttonElement} />
        <TooltipContent side={tooltipSide} className="p-1 px-1.5">
          {tooltipNode}
        </TooltipContent>
      </Tooltip>
    ) : (
      buttonElement
    )

    return (
      <div className={cn(positionConfig.container, containerClassName)}>
        <div className={positionConfig.inner}>{renderedButton}</div>
      </div>
    )
  }
)

FloatingActionButton.displayName = 'FloatingActionButton'

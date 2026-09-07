import { useLayoutEffect, useRef, useState } from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "cn"

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

interface TooltipContentProps
  extends TooltipPrimitive.Popup.Props,
    Pick<
      TooltipPrimitive.Positioner.Props,
      "align" | "alignOffset" | "side" | "sideOffset"
    > {
  maxHeight?: number
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  maxHeight = 220,
  children,
  ...props
}: TooltipContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [needsScroll, setNeedsScroll] = useState(false)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (el) {
      const isOverflowing = el.scrollHeight > maxHeight
      if (isOverflowing !== needsScroll) {
        setNeedsScroll(isOverflowing)
      }
    }
  }, [children, maxHeight, needsScroll])

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) flex-col gap-1.5 rounded-lg border border-border bg-popover/90 p-2.5 text-xs text-popover-foreground shadow-md backdrop-blur-md has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {needsScroll ? (
            <ScrollArea style={{ maxHeight: `${maxHeight}px` }} className="w-full">
              <div ref={contentRef} className="pr-2">
                {children}
              </div>
            </ScrollArea>
          ) : (
            <div ref={contentRef} className="w-full">
              {children}
            </div>
          )}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

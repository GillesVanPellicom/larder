import { useLayoutEffect, useRef, useState, useEffect, useContext, createContext, useMemo, useCallback } from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "cn"
import { useIsMobile } from "@/hooks/useIsMobile"

// Global single-listener mobile tooltip coordinator
let activeMobileClose: (() => void) | null = null
let activeMobileTrigger: HTMLElement | null = null

function registerActiveMobileTooltip(closeFn: () => void, triggerEl: HTMLElement | null) {
  if (activeMobileClose && activeMobileClose !== closeFn) {
    activeMobileClose()
  }
  activeMobileClose = closeFn
  activeMobileTrigger = triggerEl
}

function unregisterActiveMobileTooltip(closeFn?: () => void) {
  if (!closeFn || activeMobileClose === closeFn) {
    activeMobileClose = null
    activeMobileTrigger = null
  }
}

// Single window listener for all tooltips when any mobile tooltip is open
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (!activeMobileClose) return
      const target = e.target as Node | null
      if (!target) return

      // If clicked inside the active trigger, let the trigger handler toggle it
      if (activeMobileTrigger && activeMobileTrigger.contains(target)) {
        return
      }

      // If clicked inside the tooltip popup itself, don't close it
      const popup = (target as HTMLElement).closest?.('[data-slot="tooltip-content"]')
      if (popup) {
        return
      }

      // Outside tap: close active tooltip
      const close = activeMobileClose
      activeMobileClose = null
      activeMobileTrigger = null
      close()
    },
    true
  )
}

interface TooltipContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  isMobile: boolean
  onTriggerClick: (el: HTMLElement | null) => void
}

const TooltipContext = createContext<TooltipContextValue | null>(null)

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

function Tooltip({
  open: controlledOpen,
  onOpenChange,
  children,
  ...props
}: TooltipPrimitive.Root.Props) {
  const isMobile = useIsMobile()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)

  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen

  const handleOpenChange = (
    nextOpen: boolean,
    details: TooltipPrimitive.Root.ChangeEventDetails
  ) => {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }
    onOpenChange?.(nextOpen, details)
  }

  const setOpen = useCallback((next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next)
    }
    onOpenChange?.(next, { reason: 'triggerPress' } as unknown as TooltipPrimitive.Root.ChangeEventDetails)
  }, [isControlled, onOpenChange])

  const onTriggerClick = useCallback((el: HTMLElement | null) => {
    triggerRef.current = el
    setOpen(!isOpen)
  }, [isOpen, setOpen])

  useEffect(() => {
    if (isMobile && isOpen) {
      const closeFn = () => {
        if (!isControlled) {
          setUncontrolledOpen(false)
        }
        onOpenChange?.(false, { reason: 'outsidePress' } as unknown as TooltipPrimitive.Root.ChangeEventDetails)
      }
      registerActiveMobileTooltip(closeFn, triggerRef.current)

      return () => {
        unregisterActiveMobileTooltip(closeFn)
      }
    }
  }, [isMobile, isOpen, isControlled, onOpenChange])

  const contextValue = useMemo(
    () => ({
      isOpen,
      setIsOpen: setOpen,
      isMobile,
      onTriggerClick,
    }),
    [isOpen, isMobile, setOpen, onTriggerClick]
  )

  return (
    <TooltipContext.Provider value={contextValue}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        {...(isMobile ? { open: isOpen, onOpenChange: handleOpenChange } : {})}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipContext.Provider>
  )
}

function TooltipTrigger({
  onClick,
  ...props
}: TooltipPrimitive.Trigger.Props) {
  const ctx = useContext(TooltipContext)

  const handleClick: TooltipPrimitive.Trigger.Props['onClick'] = (e) => {
    onClick?.(e)
    if (ctx?.isMobile) {
      ctx.onTriggerClick(e.currentTarget ? (e.currentTarget as HTMLElement) : null)
    }
  }

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      closeOnClick={ctx?.isMobile ? false : props.closeOnClick}
      onClick={handleClick}
      {...props}
    />
  )
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
      setNeedsScroll(isOverflowing)
    }
  }, [children, maxHeight])

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

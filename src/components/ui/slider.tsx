import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "cn"

interface SliderProps extends SliderPrimitive.Root.Props {
  ticks?: number
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ticks,
  ...props
}: SliderProps) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]

  return (
    <SliderPrimitive.Root
      className={cn("w-full select-none", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center py-2 select-none data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted select-none"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none h-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            index={index}
            aria-label={index === 0 ? "Minimum value" : "Maximum value"}
            className="block size-4 shrink-0 rounded-full border-2 border-primary bg-background shadow-xs transition-transform select-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
          />
        ))}
      </SliderPrimitive.Control>
      {ticks !== undefined && ticks > 1 && (
        <div className="relative w-full h-2 mt-0.5 pointer-events-none select-none">
          {Array.from({ length: ticks }).map((_, i) => {
            const pct = (i / (ticks - 1)) * 100
            return (
              <div
                key={i}
                className="absolute top-0 -translate-x-1/2 w-1 h-1.5 rounded-full bg-border"
                style={{ left: `${pct}%` }}
              />
            )
          })}
        </div>
      )}
    </SliderPrimitive.Root>
  )
}

export { Slider }


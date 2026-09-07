import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Check, ChevronDown, Search, X } from 'lucide-react'

export interface MultiSelectProps {
  options: string[]
  values: string[]
  onValuesChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxVisibleBadges?: number
}

export function MultiSelect({
  options,
  values,
  onValuesChange,
  placeholder = 'Select items...',
  className = '',
  disabled = false,
  maxVisibleBadges = 2,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [open])

  // Close on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const toggleOption = (opt: string) => {
    if (values.includes(opt)) {
      onValuesChange(values.filter((v) => v !== opt))
    } else {
      onValuesChange([...values, opt])
    }
  }

  const removeValue = (e: React.MouseEvent, val: string) => {
    e.stopPropagation()
    onValuesChange(values.filter((v) => v !== val))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValuesChange([])
  }

  const selectAll = () => {
    onValuesChange([...options])
  }

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase().trim())
  )

  const visibleBadges = values.slice(0, maxVisibleBadges)
  const remainingCount = values.length - maxVisibleBadges

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-8.5 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-card px-2.5 py-1 text-xs transition-colors outline-hidden select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-card dark:hover:bg-muted/30 cursor-pointer ${
          open ? 'border-ring ring-3 ring-ring/50' : 'hover:border-input/80'
        }`}
      >
        <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
          {values.length === 0 ? (
            <span className="text-muted-foreground text-xs">{placeholder}</span>
          ) : (
            <>
              {visibleBadges.map((val) => (
                <Badge
                  key={val}
                  variant="secondary"
                  className="flex items-center gap-1 py-0 px-1.5 text-[11px] font-medium h-5"
                >
                  <span className="truncate max-w-[120px]">{val}</span>
                  <span
                    onClick={(e) => removeValue(e, val)}
                    className="hover:text-destructive cursor-pointer rounded-full p-0.2"
                  >
                    <X className="h-2.5 w-2.5" />
                  </span>
                </Badge>
              ))}
              {remainingCount > 0 && (
                <Badge
                  variant="outline"
                  className="py-0 px-1.5 text-[10px] font-mono font-medium h-5"
                >
                  +{remainingCount}
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 text-muted-foreground shrink-0 ml-1">
          {values.length > 0 && (
            <span
              onClick={clearAll}
              title="Clear selection"
              className="hover:text-foreground cursor-pointer p-0.5 rounded"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Content Dropdown (Aligned with Trigger) */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[220px] rounded-lg border border-border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 animate-in fade-in-0 zoom-in-95 p-1.5">
          {/* Quick Search if options > 5 */}
          {options.length > 5 && (
            <div className="relative mb-1.5">
              <Search className="absolute left-2 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 text-xs pl-7 bg-muted/30"
                autoFocus
              />
            </div>
          )}

          {/* Action Row */}
          {options.length > 3 && (
            <div className="flex items-center justify-between px-1.5 py-1 mb-1 border-b border-border/60 text-[10px] text-muted-foreground">
              <button
                type="button"
                onClick={selectAll}
                className="hover:text-foreground font-medium cursor-pointer"
              >
                Select all ({options.length})
              </button>
              {values.length > 0 && (
                <button
                  type="button"
                  onClick={() => onValuesChange([])}
                  className="hover:text-destructive font-medium cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-xs text-muted-foreground italic">
                No matching tags found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt)
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer select-none transition-colors ${
                      isSelected
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOption(opt)}
                        className="h-3.5 w-3.5"
                      />
                      <span>{opt}</span>
                    </div>
                    {isSelected && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

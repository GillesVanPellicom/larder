import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { ingredientsApi } from '@/services/api'
import { CreateIngredientModal } from './CreateIngredientModal'
import { Check, Loader2, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from 'cn'
import { useIsMobile } from '@/hooks/useIsMobile'

interface IngredientComboboxProps {
  value: string
  onChange: (name: string) => void
  onEnterPress?: () => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

// Global cache for query results so duplicate/backtrack searches are instant across all rows
const searchCache = new Map<string, { items: { id: number; name: string }[]; hasMore: boolean }>()

export function IngredientCombobox({
  value,
  onChange,
  onEnterPress,
  placeholder = 'Ingredient name',
  className = '',
  autoFocus = false,
}: IngredientComboboxProps) {
  const isMobile = useIsMobile()
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ id: number; name: string }[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createInitialName, setCreateInitialName] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const justSelectedRef = useRef(false)

  // Keep inputValue in sync with external value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Click outside listener
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  // Debounced search
  const performSearch = (q: string) => {
    const trimmed = q.trim()
    if (searchCache.has(trimmed.toLowerCase())) {
      const cached = searchCache.get(trimmed.toLowerCase())!
      setResults(cached.items)
      setHasMore(cached.hasMore)
      setLoading(false)
      return
    }

    setLoading(true)
    ingredientsApi
      .search(trimmed, 8)
      .then((res) => {
        searchCache.set(trimmed.toLowerCase(), { items: res.items, hasMore: res.hasMore })
        setResults(res.items)
        setHasMore(res.hasMore)
      })
      .catch((err) => {
        console.error('Ingredient search error:', err)
        setResults([])
        setHasMore(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    setHighlightedIndex(-1)

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (val.trim()) {
      setIsOpen(true)
      timerRef.current = setTimeout(() => {
        performSearch(val)
      }, 150)
    } else {
      setResults([])
      setHasMore(false)
      onChange('')
    }
  }

  const handleInputFocus = () => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    if (inputValue.trim()) {
      setIsOpen(true)
      performSearch(inputValue)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // If focus is moving inside container (e.g. clicking dropdown or modal), don't revert yet
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
      return
    }

    if (justSelectedRef.current) {
      justSelectedRef.current = false
      setIsOpen(false)
      return
    }

    const trimmed = inputValue.trim()
    if (!trimmed) {
      setInputValue('')
      onChange('')
      setIsOpen(false)
      return
    }

    // Check if it matches currently confirmed value
    if (trimmed.toLowerCase() === value.trim().toLowerCase()) {
      setInputValue(value)
      setIsOpen(false)
      return
    }

    // Check if results has exact match
    const exactMatch = results.find((r) => r.name.toLowerCase() === trimmed.toLowerCase())
    if (exactMatch) {
      handleSelect(exactMatch.name)
    } else {
      // Revert uncommitted freeform text to the last confirmed value
      setInputValue(value)
      setIsOpen(false)
    }
  }

  const handleSelect = (name: string) => {
    justSelectedRef.current = true
    setInputValue(name)
    if (inputRef.current) {
      inputRef.current.value = name
    }
    onChange(name)
    setIsOpen(false)
    setHighlightedIndex(-1)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }

  const handleOpenCreateModal = (nameToCreate: string) => {
    setCreateInitialName(nameToCreate)
    setIsCreateModalOpen(true)
    setIsOpen(false)
  }

  const handleCreated = (created: { id: number; name: string }) => {
    handleSelect(created.name)
    searchCache.clear()
  }

  const trimmedQuery = inputValue.trim()
  const exactMatchExists = results.some(
    (item) => item.name.toLowerCase() === trimmedQuery.toLowerCase()
  )
  const showCreateOption = trimmedQuery.length > 0 && !exactMatchExists

  // List of selectable items: index 0 is create option if showCreateOption, followed by results
  const totalOptions = (showCreateOption ? 1 : 0) + results.length

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!isOpen && trimmedQuery) {
        setIsOpen(true)
        performSearch(inputValue)
        return
      }
      if (isOpen && totalOptions > 0) {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1) % totalOptions)
      }
    } else if (e.key === 'ArrowUp') {
      if (isOpen && totalOptions > 0) {
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions)
      }
    } else if (e.key === 'Enter') {
      if (isOpen) {
        e.preventDefault()
        if (highlightedIndex === 0 && showCreateOption) {
          handleOpenCreateModal(trimmedQuery)
        } else if (highlightedIndex > 0 || (!showCreateOption && highlightedIndex === 0)) {
          const resultIdx = showCreateOption ? highlightedIndex - 1 : highlightedIndex
          const selected = results[resultIdx]
          if (selected) {
            handleSelect(selected.name)
          }
        } else {
          // No option highlighted: check for exact match or open create modal
          const exact = results.find((r) => r.name.toLowerCase() === trimmedQuery.toLowerCase())
          if (exact) {
            handleSelect(exact.name)
          } else if (trimmedQuery.length > 0) {
            handleOpenCreateModal(trimmedQuery)
          } else {
            setIsOpen(false)
            if (onEnterPress) onEnterPress()
          }
        }
      } else {
        // Dropdown not open -> user pressed Enter to append row
        setIsOpen(false)
        if (onEnterPress) {
          e.preventDefault()
          onEnterPress()
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
        setInputValue(value)
      }
    } else if (e.key === 'Tab') {
      const exact = results.find((r) => r.name.toLowerCase() === trimmedQuery.toLowerCase())
      if (exact) {
        handleSelect(exact.name)
      } else {
        setInputValue(value)
      }
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={cn('relative flex-1 min-w-0', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-form-type="other"
          data-lpignore="true"
          data-1p-ignore="true"
          className="w-full text-sm font-medium pr-7"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </div>
        )}
      </div>

      {/* Popover Results Dropdown */}
      {isOpen && (showCreateOption || results.length > 0 || hasMore) && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full rounded-xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-72 sm:max-h-60 overflow-y-auto">
          {/* Top Option: Create New Ingredient */}
          {showCreateOption && (
            <>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleOpenCreateModal(trimmedQuery)
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg cursor-pointer transition-colors text-primary',
                  isMobile
                    ? 'min-h-11 px-3 py-2.5 text-sm font-semibold'
                    : 'min-h-8 px-2.5 py-1.5 text-xs font-semibold',
                  highlightedIndex === 0
                    ? 'bg-primary/15 text-primary'
                    : 'hover:bg-primary/10'
                )}
              >
                <Plus className={cn("shrink-0", isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
                <span className="truncate">
                  Create new ingredient &ldquo;<span className="font-bold">{trimmedQuery}</span>&rdquo;
                </span>
              </button>
              <div className="-mx-1 my-1 h-px bg-border" />
            </>
          )}

          {/* Database Results */}
          {results.map((item, index) => {
            const optionIndex = showCreateOption ? index + 1 : index
            const isHighlighted = highlightedIndex === optionIndex
            const isSelected = item.name.toLowerCase() === inputValue.trim().toLowerCase()

            return (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(item.name)
                }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg cursor-pointer transition-colors text-foreground',
                  isMobile
                    ? 'min-h-11 px-3 py-2.5 text-base sm:text-sm font-medium'
                    : 'min-h-8 px-2.5 py-1.5 text-xs font-medium',
                  isHighlighted
                    ? 'bg-accent text-accent-foreground font-semibold'
                    : 'hover:bg-accent/60'
                )}
              >
                <span className="truncate">{item.name}</span>
                {isSelected && (
                  <Check className={cn("text-primary shrink-0 ml-2", isMobile ? "h-4 w-4" : "h-3.5 w-3.5")} />
                )}
              </button>
            )
          })}

          {/* Bottom Ellipsis Indicator for More Results */}
          {hasMore && (
            <div className={cn(
              "flex items-center justify-center gap-1.5 text-muted-foreground border-t border-border/40 mt-1 select-none",
              isMobile ? "py-2.5 px-3 text-xs" : "py-1.5 px-2 text-[11px]"
            )}>
              <MoreHorizontal className="h-3.5 w-3.5 opacity-60" />
              <span>More results available, keep typing...</span>
            </div>
          )}
        </div>
      )}

      {/* Creation Modal */}
      <CreateIngredientModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        initialName={createInitialName}
        onCreated={handleCreated}
      />
    </div>
  )
}

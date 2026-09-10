import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { storesApi, type StoreRecord } from '@/services/api'
import { CreateStoreModal } from './CreateStoreModal'
import { Check, ChevronDown, Loader2, Plus, Store } from 'lucide-react'
import { cn } from 'cn'
import { useIsMobile } from '@/hooks/useIsMobile'

interface StoreComboboxProps {
  value: string
  onChange: (storeName: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function StoreCombobox({
  value,
  onChange,
  placeholder = 'Select or search store...',
  className = '',
  autoFocus = false,
}: StoreComboboxProps) {
  const isMobile = useIsMobile()
  const [inputValue, setInputValue] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stores, setStores] = useState<StoreRecord[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createInitialName, setCreateInitialName] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const justSelectedRef = useRef(false)

  // Keep input in sync with external value
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

  // Fetch stores
  const fetchStores = (q: string) => {
    setLoading(true)
    storesApi
      .search(q.trim(), 20)
      .then((res) => {
        setStores(res.items || [])
      })
      .catch((err) => {
        console.error('Store search error:', err)
        setStores([])
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

    setIsOpen(true)
    timerRef.current = setTimeout(() => {
      fetchStores(val)
    }, 150)
  }

  const handleInputFocus = () => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    setIsOpen(true)
    fetchStores(inputValue)
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
  }

  const trimmedQuery = inputValue.trim()
  const exactMatchExists = stores.some(
    (item) => item.name.toLowerCase() === trimmedQuery.toLowerCase()
  )
  const showCreateOption = trimmedQuery.length > 0 && !exactMatchExists
  const totalOptions = (showCreateOption ? 1 : 0) + stores.length

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!isOpen) {
        setIsOpen(true)
        fetchStores(inputValue)
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
          const selected = stores[resultIdx]
          if (selected) {
            handleSelect(selected.name)
          }
        } else {
          const exact = stores.find((r) => r.name.toLowerCase() === trimmedQuery.toLowerCase())
          if (exact) {
            handleSelect(exact.name)
          } else if (trimmedQuery.length > 0) {
            handleOpenCreateModal(trimmedQuery)
          } else {
            setIsOpen(false)
          }
        }
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault()
        setIsOpen(false)
        setInputValue(value)
      }
    }
  }

  return (
    <div ref={containerRef} className={cn('relative flex-1 min-w-[200px]', className)}>
      <div className="relative">
        <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full text-sm font-medium pl-9.5 pr-8 h-9 bg-card border-border"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-muted-foreground">
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
          )}
        </div>
      </div>

      {/* Popover Results Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-full min-w-[220px] rounded-xl border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-72 sm:max-h-60 overflow-y-auto">
          {/* Top Option: Create New Store */}
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
                  Create store &ldquo;<span className="font-bold">{trimmedQuery}</span>&rdquo;
                </span>
              </button>
              <div className="-mx-1 my-1 h-px bg-border" />
            </>
          )}

          {/* Database Results */}
          {stores.length === 0 && !showCreateOption ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              {loading ? 'Searching stores...' : 'No stores found. Type a name to create one.'}
            </div>
          ) : (
            stores.map((item, index) => {
              const optionIndex = showCreateOption ? index + 1 : index
              const isHighlighted = highlightedIndex === optionIndex
              const isSelected = item.name.toLowerCase() === value.trim().toLowerCase()

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
            })
          )}
        </div>
      )}

      {/* Creation Modal */}
      <CreateStoreModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        initialName={createInitialName}
        onCreated={handleCreated}
      />
    </div>
  )
}

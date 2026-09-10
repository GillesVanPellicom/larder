import { useState, useEffect, useRef, useCallback } from 'react'
import { ingredientsApi, type IngredientRecord } from '@/services/api'
import { formatBelgianDateTime } from '@/lib/dateTime'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaginationControl } from '@/components/ui/pagination'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { EditIngredientModal } from '@/components/ingredients/EditIngredientModal'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Carrot,
  Loader2,
  Search,
  Utensils,
  X,
} from 'lucide-react'
import { cn } from 'cn'

type SortColumn = 'name' | 'created_at' | 'usage_count'
type SortOrder = 'asc' | 'desc'

export function IngredientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [items, setItems] = useState<IngredientRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortBy, setSortBy] = useState<SortColumn | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientRecord | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
      setCurrentPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch paginated ingredients
  const fetchIngredients = useCallback(async () => {
    try {
      setLoading(true)
      const res = await ingredientsApi.getPaginated({
        q: debouncedQuery,
        page: currentPage,
        pageSize,
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      })
      setItems(res.items || [])
      setTotalCount(res.totalCount || 0)
      setTotalPages(res.totalPages || Math.ceil((res.totalCount || 0) / pageSize) || 1)
    } catch (err) {
      console.error('Failed to load ingredients:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, currentPage, pageSize, sortBy, sortOrder])

  useEffect(() => {
    void fetchIngredients()
  }, [fetchIngredients])

  // Keyboard navigation for pagination (Left / Right Arrow)
  useEffect(() => {
    if (totalPages <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable
      ) {
        return
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      if (e.key === 'ArrowLeft') {
        if (currentPage > 1) {
          e.preventDefault()
          setCurrentPage((prev) => Math.max(1, prev - 1))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) {
          e.preventDefault()
          setCurrentPage((prev) => Math.min(totalPages, prev + 1))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages])

  // 3-state sorting cycle: First -> Second -> Default (null)
  const handleSort = (column: SortColumn) => {
    if (sortBy !== column) {
      // 1st click on new column: 'asc' for alphabetical name, 'desc' for date and usage
      setSortBy(column)
      setSortOrder(column === 'name' ? 'asc' : 'desc')
    } else {
      // Clicking already active column
      if (column === 'name') {
        if (sortOrder === 'asc') {
          setSortOrder('desc')
        } else {
          // 3rd click: return to default
          setSortBy(null)
          setSortOrder(null)
        }
      } else {
        if (sortOrder === 'desc') {
          setSortOrder('asc')
        } else {
          // 3rd click: return to default
          setSortBy(null)
          setSortOrder(null)
        }
      }
    }
    setCurrentPage(1)
  }

  const renderSortIcon = (column: SortColumn) => {
    if (sortBy !== column || !sortOrder) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 ml-1.5" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-foreground shrink-0 ml-1.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-foreground shrink-0 ml-1.5" />
    )
  }

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-32 sm:pb-36 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
              Ingredients
            </h1>
            <InfoTooltip content="Ingredients used across recipes. Click column headers to sort by name, creation date, or recipe usage." />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-light">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading ingredients...</span>
              </span>
            ) : (
              `${totalCount} unique ingredient${totalCount === 1 ? '' : 's'}`
            )}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-border" />

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9.5 pr-9 bg-card border-border shadow-2xs h-12 sm:h-10 text-base md:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground select-none">
                <th
                  scope="col"
                  onClick={() => handleSort('name')}
                  className="w-1/2 py-3.5 px-4 sm:px-6 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <span>Ingredient</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort('created_at')}
                  className="w-1/4 py-3.5 px-4 sm:px-6 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center">
                    <span>Created</span>
                    {renderSortIcon('created_at')}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort('usage_count')}
                  className="w-1/4 py-3.5 px-4 sm:px-6 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Used in</span>
                    {renderSortIcon('usage_count')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                      <span className="text-xs font-light">Loading ingredients...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Carrot className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-light text-foreground">
                        {debouncedQuery ? `No ingredients matching "${debouncedQuery}"` : 'No ingredients found'}
                      </p>
                      {debouncedQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs cursor-pointer"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((ingredient) => (
                  <tr
                    key={ingredient.id}
                    onClick={() => setSelectedIngredient(ingredient)}
                    className="hover:bg-muted/35 transition-colors group cursor-pointer"
                    title="Click to edit ingredient"
                  >
                    {/* Column 1: Ingredient Name (50%) */}
                    <td className="py-3.5 px-4 sm:px-6 font-normal text-foreground truncate">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                        <span className="font-medium text-foreground tracking-tight group-hover:underline truncate">
                          {ingredient.name}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Date Created (Belgian Time) (25%) */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-muted-foreground whitespace-nowrap font-light truncate">
                      {formatBelgianDateTime(ingredient.created_at)}
                    </td>

                    {/* Column 3: Usage in Recipes (25%) */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                          (ingredient.usage_count ?? 0) > 0
                            ? 'bg-muted text-foreground group-hover:bg-muted/80'
                            : 'bg-muted/40 text-muted-foreground/70'
                        )}
                      >
                        <Utensils className="h-3 w-3 opacity-60 shrink-0" />
                        <span>
                          {ingredient.usage_count ?? 0}{' '}
                          {(ingredient.usage_count ?? 0) === 1 ? 'recipe' : 'recipes'}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-4 sm:px-6">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            pageSize={pageSize}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            onPageChange={(page) => {
              setCurrentPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {/* Edit Ingredient Modal */}
      <EditIngredientModal
        open={!!selectedIngredient}
        onOpenChange={(open) => {
          if (!open) setSelectedIngredient(null)
        }}
        ingredient={selectedIngredient}
        onUpdated={(updated) => {
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? { ...item, name: updated.name } : item))
          )
        }}
      />
    </div>
  )
}

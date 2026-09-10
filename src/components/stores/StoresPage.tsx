import { useState, useEffect, useRef, useCallback } from 'react'
import { storesApi, type StoreRecord } from '@/services/api'
import { formatBelgianDateTime } from '@/lib/dateTime'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaginationControl } from '@/components/ui/pagination'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { EditStoreModal } from '@/components/stores/EditStoreModal'
import { CreateStoreModal } from '@/components/stores/CreateStoreModal'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  Plus,
  Search,
  Store,
  X,
} from 'lucide-react'
import { cn } from 'cn'

type SortColumn = 'name' | 'created_at'
type SortOrder = 'asc' | 'desc'

export interface StoresPageProps {
  embedded?: boolean
}

export function StoresPage({ embedded = false }: StoresPageProps = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [items, setItems] = useState<StoreRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortBy, setSortBy] = useState<SortColumn | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<StoreRecord | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
      setCurrentPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch paginated stores
  const fetchStores = useCallback(async () => {
    try {
      setLoading(true)
      const res = await storesApi.getPaginated({
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
      console.error('Failed to load stores:', err)
    } finally {
      setLoading(false)
    }
  }, [debouncedQuery, currentPage, pageSize, sortBy, sortOrder])

  useEffect(() => {
    void fetchStores()
  }, [fetchStores])

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
      setSortBy(column)
      setSortOrder(column === 'name' ? 'asc' : 'desc')
    } else {
      if (column === 'name') {
        if (sortOrder === 'asc') {
          setSortOrder('desc')
        } else {
          setSortBy(null)
          setSortOrder(null)
        }
      } else {
        if (sortOrder === 'desc') {
          setSortOrder('asc')
        } else {
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
    <div className={cn('space-y-6 w-full animate-in fade-in duration-150', !embedded && 'max-w-7xl mx-auto pb-32 sm:pb-36')}>
      {!embedded && (
        <>
          {/* Top Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
                  Stores
                </h1>
                <InfoTooltip content="Stores and merchants for organizing shopping lists. Click column headers to sort by name or creation date." />
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-light">
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading stores...</span>
                  </span>
                ) : (
                  `${totalCount} store${totalCount === 1 ? '' : 's'}`
                )}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Store</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="border-b border-border" />
        </>
      )}

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 bg-card border-border shadow-2xs h-12 sm:h-10 text-base md:text-sm"
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

        <div className="flex items-center gap-3 self-end sm:self-center">
          {embedded && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
              <InfoTooltip content="Stores and merchants for organizing shopping lists. Click column headers to sort by name or creation date." />
              <span>
                {loading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Loading...</span>
                  </span>
                ) : (
                  `${totalCount} store${totalCount === 1 ? '' : 's'}`
                )}
              </span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Store</span>
          </Button>
        </div>
      </div>

      {/* Stores Table */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground select-none">
                <th
                  scope="col"
                  onClick={() => handleSort('name')}
                  className="w-2/3 py-3.5 px-4 sm:px-6 cursor-pointer hover:text-foreground transition-colors"
                >
                  <div className="flex items-center">
                    <span>Store Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th
                  scope="col"
                  onClick={() => handleSort('created_at')}
                  className="w-1/3 py-3.5 px-4 sm:px-6 cursor-pointer hover:text-foreground transition-colors whitespace-nowrap text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Created</span>
                    {renderSortIcon('created_at')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/60" />
                      <span className="text-xs font-light">Loading stores...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Store className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-light text-foreground">
                        {debouncedQuery ? `No stores matching "${debouncedQuery}"` : 'No stores found'}
                      </p>
                      {debouncedQuery ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2 text-xs cursor-pointer"
                        >
                          Clear search
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="mt-2 text-xs cursor-pointer gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add your first store</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((store) => (
                  <tr
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className="hover:bg-muted/35 transition-colors group cursor-pointer"
                    title="Click to edit store"
                  >
                    {/* Column 1: Store Name */}
                    <td className="py-3.5 px-4 sm:px-6 font-normal text-foreground truncate">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Store className="h-4 w-4 text-primary/70 group-hover:text-primary transition-colors shrink-0" />
                        <span className="font-medium text-foreground tracking-tight group-hover:underline truncate">
                          {store.name}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Date Created (Belgian Time) */}
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-muted-foreground whitespace-nowrap font-light truncate text-right">
                      {store.created_at ? formatBelgianDateTime(store.created_at) : '—'}
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

      {/* Edit Store Modal */}
      <EditStoreModal
        open={!!selectedStore}
        onOpenChange={(open) => {
          if (!open) setSelectedStore(null)
        }}
        store={selectedStore}
        onUpdated={(updated) => {
          setItems((prev) =>
            prev.map((item) => (item.id === updated.id ? { ...item, name: updated.name } : item))
          )
        }}
      />

      {/* Create Store Modal */}
      <CreateStoreModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        initialName=""
        onCreated={() => {
          void fetchStores()
        }}
      />
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { FilterCriteria, Recipe, RecipeTemplate, RecipeViolation, TagCategory, TimeTrackingMode } from '@/shared/types'
import { RecipeCard } from '@/components/RecipeCard'
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar'
import { ActiveFiltersBar } from '@/components/catalog/ActiveFiltersBar'
import { CatalogEmptyState } from '@/components/catalog/CatalogEmptyState'
import { getShortcutLabel } from '@/lib/shortcuts'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { PaginationControl } from '@/components/ui/pagination'
import { Database, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDeviceSettings } from '@/lib/deviceSettings'

interface RecipesCatalogPageProps {
  recipes: Recipe[]
  filteredRecipes: Recipe[]
  categories: TagCategory[]
  templates?: RecipeTemplate[]
  violationsMap: Map<number, RecipeViolation[]>
  loading: boolean
  isDatabaseConnected?: boolean
  filterCriteria: FilterCriteria
  activeFiltersCount: number
  timeTrackingMode?: TimeTrackingMode
  onFilterCriteriaChange: (criteria: FilterCriteria) => void
  onToggleTag?: (catId: string, tag: string) => void
  onResetFilters: () => void
  onOpenFilterDrawer: () => void
  onNewRecipe: () => void
  onOpenSettings: (tab?: 'rules' | 'appearance' | 'integrations') => void
  onViewRecipe: (recipe: Recipe) => void
  onEditRecipe: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
}

export function RecipesCatalogPage({
  recipes,
  filteredRecipes,
  categories,
  templates = [],
  violationsMap,
  loading,
  isDatabaseConnected = true,
  filterCriteria,
  activeFiltersCount,
  timeTrackingMode = 'prep_and_cook',
  onFilterCriteriaChange,
  onToggleTag,
  onResetFilters,
  onOpenFilterDrawer,
  onNewRecipe,
  onOpenSettings,
  onViewRecipe,
  onEditRecipe,
  onDeleteRequest,
}: RecipesCatalogPageProps) {
  const { settings, setSetting } = useDeviceSettings()
  const [currentPage, setCurrentPage] = useState(1)

  const pageSize = settings.recipesPerPage || 12
  const totalItems = filteredRecipes.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Reset to page 1 whenever filter criteria change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterCriteria])

  // Clamp current page if items change
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedRecipes = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize
    return filteredRecipes.slice(start, start + pageSize)
  }, [filteredRecipes, validCurrentPage, pageSize])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setSetting('recipesPerPage', newSize)
    setCurrentPage(1)
  }

  // Keyboard arrow keys navigation (Left Arrow: Prev, Right Arrow: Next)
  useEffect(() => {
    if (totalPages <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing inside inputs, textareas, selects, or editable elements
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

      // Don't trigger if modifier keys (Cmd/Ctrl/Alt/Shift) are pressed
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return

      if (e.key === 'ArrowLeft') {
        if (validCurrentPage > 1) {
          e.preventDefault()
          handlePageChange(validCurrentPage - 1)
        }
      } else if (e.key === 'ArrowRight') {
        if (validCurrentPage < totalPages) {
          e.preventDefault()
          handlePageChange(validCurrentPage + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [validCurrentPage, totalPages])

  // When no database is configured or connected, render isolated "No database connected" screen
  if (!isDatabaseConnected && !loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-4 my-auto min-h-[calc(100vh-10rem)]">
        <Database className="h-12 w-12 text-muted-foreground/35" />
        <h3 className="mt-4 text-base sm:text-lg font-semibold text-foreground">
          No database connected
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
          A PostgreSQL database connection is required to store and view your recipes, tags, and custom metadata.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <Button size="default" onClick={() => onOpenSettings('integrations')} className="cursor-pointer">
            Settings
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-6.5rem)] space-y-6">
      {/* Floating Action Button for New Recipe */}
      <FloatingActionButton
        icon={<Plus />}
        onClick={onNewRecipe}
        tooltip={`New${getShortcutLabel('n')}`}
      />

      {/* Catalog Search & Action Toolbar */}
      <CatalogToolbar
        searchQuery={filterCriteria.searchQuery}
        onSearchChange={(query) =>
          onFilterCriteriaChange({ ...filterCriteria, searchQuery: query })
        }
        activeFiltersCount={activeFiltersCount}
        onResetFilters={onResetFilters}
        onOpenFilterDrawer={onOpenFilterDrawer}
        onOpenSettings={onOpenSettings}
      />

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <ActiveFiltersBar
          criteria={filterCriteria}
          onChange={onFilterCriteriaChange}
        />
      )}

      {/* Content Area: Loading, Empty, or Recipes Grid */}
      {loading && recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 my-auto">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading culinary recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <CatalogEmptyState
            hasRecipes={recipes.length > 0}
            onResetFilters={onResetFilters}
            onNewRecipe={onNewRecipe}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                violations={violationsMap.get(recipe.id)}
                categories={categories}
                template={templates.find((t) => t.id === (recipe.template_id || 'tpl_default'))}
                timeTrackingMode={timeTrackingMode}
                selectedTags={filterCriteria.selectedTags}
                onToggleTag={onToggleTag}
                onView={onViewRecipe}
                onEdit={onEditRecipe}
                onDeleteRequest={onDeleteRequest}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <PaginationControl
            currentPage={validCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={[6, 12, 24, 48, 96]}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  )
}


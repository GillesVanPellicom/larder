import { useState, useEffect } from 'react'
import type {
  FilterCriteria,
  FilterTemplate,
  Recipe,
  RecipeViolation,
  TagCategory,
  TimeTrackingMode,
} from '@/shared/types'
import { RecipeCard } from '@/components/RecipeCard'
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar'
import { ActiveFiltersBar } from '@/components/catalog/ActiveFiltersBar'
import { FilterTemplateChips } from '@/components/catalog/FilterTemplateChips'
import { SaveTemplateModal } from '@/components/filter-drawer/SaveTemplateModal'
import { CatalogEmptyState } from '@/components/catalog/CatalogEmptyState'
import { isMac } from '@/lib/shortcuts'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { PaginationControl } from '@/components/ui/pagination'
import { Database, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { useDeviceSettings } from '@/lib/deviceSettings'
import { useIsMobile } from '@/hooks/useIsMobile'

interface RecipesCatalogPageProps {
  recipes: Recipe[]
  totalCount: number
  totalPages: number
  currentPage: number
  onPageChange: (page: number) => void
  categories: TagCategory[]
  violationsMap: Map<number, RecipeViolation[]>
  loading: boolean
  isDatabaseConnected?: boolean
  filterCriteria: FilterCriteria
  activeFiltersCount: number
  timeTrackingMode?: TimeTrackingMode
  templates?: FilterTemplate[]
  onApplyTemplate?: (template: FilterTemplate) => void
  onCreateTemplate?: (name: string, criteria: FilterCriteria) => Promise<FilterTemplate>
  onFilterCriteriaChange: (criteria: FilterCriteria) => void
  onToggleTag?: (catId: string, tag: string) => void
  onResetFilters: () => void
  onOpenFilterDrawer: (tab?: 'filters' | 'templates') => void
  onNewRecipe: () => void
  onOpenSettings: (tab?: 'rules' | 'appearance' | 'integrations') => void
  isRecipeInShoppingList?: (recipeId: number) => boolean
  onToggleShoppingList?: (recipe: Recipe) => void
  onViewRecipe: (recipe: Recipe) => void
}

export function RecipesCatalogPage({
  recipes,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  categories,
  violationsMap,
  loading,
  isDatabaseConnected = true,
  filterCriteria,
  activeFiltersCount,
  timeTrackingMode = 'prep_and_cook',
  templates = [],
  onApplyTemplate,
  onCreateTemplate,
  onFilterCriteriaChange,
  onToggleTag,
  onResetFilters,
  onOpenFilterDrawer,
  onNewRecipe,
  onOpenSettings,
  isRecipeInShoppingList,
  onToggleShoppingList,
  onViewRecipe,
}: RecipesCatalogPageProps) {
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const isMobile = useIsMobile()
  const { settings, setSetting } = useDeviceSettings()
  const pageSize = settings.recipesPerPage || 12

  const handleApplyTemplate = (template: FilterTemplate) => {
    onFilterCriteriaChange(template.criteria)
    if (onApplyTemplate) {
      onApplyTemplate(template)
    }
  }

  const handleSaveModalSubmit = async (name: string) => {
    if (onCreateTemplate) {
      await onCreateTemplate(name, filterCriteria)
    }
  }

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newSize: number) => {
    setSetting('recipesPerPage', newSize)
    onPageChange(1)
  }

  // Keyboard arrow keys navigation (Left Arrow: Prev, Right Arrow: Next)
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
          handlePageChange(currentPage - 1)
        }
      } else if (e.key === 'ArrowRight') {
        if (currentPage < totalPages) {
          e.preventDefault()
          handlePageChange(currentPage + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages])

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
    <div className="flex flex-col min-h-[calc(100vh-6.5rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
              Recipes
            </h1>
            <InfoTooltip content="Browse, search, and filter your recipe collection. Filter by ingredients, tags, or cooking times." />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-light">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading recipes...</span>
              </span>
            ) : activeFiltersCount > 0 ? (
              `${totalCount} matching recipe${totalCount === 1 ? '' : 's'}`
            ) : (
              `${totalCount} recipe${totalCount === 1 ? '' : 's'} in collection`
            )}
          </p>
        </div>
      </div>

      {/* Floating Action Button for New Recipe (Always shown on mobile/tablet, falls back to sm:hidden on desktop) */}
      <FloatingActionButton
        icon={<Plus />}
        onClick={onNewRecipe}
        aria-label="New recipe"
        containerClassName={isMobile ? '' : 'sm:hidden'}
        tooltip={
          <KbdGroup>
            <Kbd>{isMac() ? '⌘' : 'Ctrl'}</Kbd>
            <span className="text-[10px] text-muted-foreground font-medium select-none px-0.5">+</span>
            <Kbd>N</Kbd>
          </KbdGroup>
        }
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
        onNewRecipe={onNewRecipe}
        isMobile={isMobile}
      />

      {/* Template Chips and Active Filters */}
      <div className="my-3.5 space-y-2">
        {(templates.length > 0 || activeFiltersCount > 0) && (
          <FilterTemplateChips
            templates={templates}
            currentCriteria={filterCriteria}
            onApplyTemplate={handleApplyTemplate}
            onSaveCurrentAsTemplate={() => setSaveModalOpen(true)}
            hasActiveFilters={activeFiltersCount > 0}
          />
        )}

        {activeFiltersCount > 0 && (
          <div className="min-h-7 flex items-center">
            <ActiveFiltersBar
              criteria={filterCriteria}
              onChange={onFilterCriteriaChange}
            />
          </div>
        )}
      </div>

      {/* Save Template Modal from Catalog */}
      <SaveTemplateModal
        open={saveModalOpen}
        onOpenChange={setSaveModalOpen}
        criteria={filterCriteria}
        onSave={handleSaveModalSubmit}
      />

      {/* Content Area: Loading, Empty, or Recipes Grid */}
      {loading && recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 my-auto">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center my-auto">
          <CatalogEmptyState
            hasRecipes={totalCount > 0 || activeFiltersCount > 0}
            onResetFilters={onResetFilters}
            onNewRecipe={onNewRecipe}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                violations={violationsMap.get(recipe.id)}
                categories={categories}
                timeTrackingMode={timeTrackingMode}
                selectedTags={filterCriteria.selectedTags}
                isInShoppingList={isRecipeInShoppingList?.(recipe.id) ?? false}
                onToggleShoppingList={onToggleShoppingList}
                onToggleTag={onToggleTag}
                onView={onViewRecipe}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
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

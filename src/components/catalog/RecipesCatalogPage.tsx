import type { FilterCriteria, Recipe, RecipeTemplate, RecipeViolation, TagCategory } from '@/shared/types'
import { RecipeCard } from '@/components/RecipeCard'
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar'
import { ActiveFiltersBar } from '@/components/catalog/ActiveFiltersBar'
import { CatalogEmptyState } from '@/components/catalog/CatalogEmptyState'
import { RefreshCw } from 'lucide-react'

interface RecipesCatalogPageProps {
  recipes: Recipe[]
  filteredRecipes: Recipe[]
  categories: TagCategory[]
  templates?: RecipeTemplate[]
  violationsMap: Map<number, RecipeViolation[]>
  loading: boolean
  filterCriteria: FilterCriteria
  activeFiltersCount: number
  onFilterCriteriaChange: (criteria: FilterCriteria) => void
  onResetFilters: () => void
  onOpenFilterDrawer: () => void
  onNewRecipe: () => void
  onViewRecipe: (recipe: Recipe) => void
  onEditRecipe: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
  hideToolbar?: boolean
}

export function RecipesCatalogPage({
  recipes,
  filteredRecipes,
  categories,
  templates = [],
  violationsMap,
  loading,
  filterCriteria,
  activeFiltersCount,
  onFilterCriteriaChange,
  onResetFilters,
  onOpenFilterDrawer,
  onNewRecipe,
  onViewRecipe,
  onEditRecipe,
  onDeleteRequest,
  hideToolbar = false,
}: RecipesCatalogPageProps) {
  return (
    <div className="space-y-6">
      {/* Catalog Search & Action Toolbar */}
      {!hideToolbar && (
        <CatalogToolbar
          searchQuery={filterCriteria.searchQuery}
          onSearchChange={(query) =>
            onFilterCriteriaChange({ ...filterCriteria, searchQuery: query })
          }
          activeFiltersCount={activeFiltersCount}
          onResetFilters={onResetFilters}
          onOpenFilterDrawer={onOpenFilterDrawer}
        />
      )}

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <ActiveFiltersBar
          criteria={filterCriteria}
          onChange={onFilterCriteriaChange}
          onResetAll={onResetFilters}
        />
      )}

      {/* Content Area: Loading, Empty, or Recipes Grid */}
      {loading && recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 bg-card">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading culinary recipes...</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <CatalogEmptyState
          onResetFilters={onResetFilters}
          onNewRecipe={onNewRecipe}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              violations={violationsMap.get(recipe.id)}
              categories={categories}
              template={templates.find((t) => t.id === (recipe.template_id || 'tpl_default'))}
              onView={onViewRecipe}
              onEdit={onEditRecipe}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </div>
  )
}

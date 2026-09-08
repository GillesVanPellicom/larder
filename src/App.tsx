import { useState } from 'react'
import type { CreateRecipeDTO, Recipe } from '@/shared/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RecipesCatalogPage } from '@/components/catalog/RecipesCatalogPage'
import { RecipeViewPage } from '@/components/recipe-view/RecipeViewPage'
import { RecipeFormPage } from '@/components/recipe-form/RecipeFormPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { FilterDrawer } from '@/components/filter-drawer/FilterDrawer'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useNavigation } from '@/hooks/useNavigation'
import { useRecipesData } from '@/hooks/useRecipesData'
import { useRecipeFilters } from '@/hooks/useRecipeFilters'
import { useAppKeyboardShortcuts } from '@/hooks/useAppKeyboardShortcuts'
import { useTemplatesData } from '@/hooks/useTemplatesData'
import { useTheme } from '@/hooks/useTheme'

export function App() {
  useTheme()
  const {
    currentView,
    selectedRecipe,
    navigateTo,
    handleBack,
    handleSavedTransition,
    handleDeletedTransition,
  } = useNavigation()

  const { templates } = useTemplatesData()

  const {
    recipes,
    categories,
    metadataConfig,
    violationsMap,
    loading,
    saveRecipe,
    deleteRecipe,
    saveConfig,
    fetchCategories,
  } = useRecipesData()

  const {
    filterCriteria,
    setFilterCriteria,
    resetFilters,
    allIngredients,
    filteredRecipes,
    activeFiltersCount,
  } = useRecipeFilters(recipes, violationsMap)

  // Drawer & Deletion Dialog States
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Global Keyboard Shortcuts (Cmd+K, Cmd+F, Cmd+N)
  useAppKeyboardShortcuts({
    onOpenFilters: () => setFilterDrawerOpen(true),
    onToggleFilters: () => setFilterDrawerOpen((prev) => !prev),
    onNewRecipe: () => navigateTo('recipe-form', null),
  })

  // Save recipe wrapper
  const handleSaveRecipe = async (data: CreateRecipeDTO, id?: number) => {
    const saved = await saveRecipe(data, id)
    handleSavedTransition(saved)
  }

  // Delete recipe confirmation
  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return
    try {
      setDeleting(true)
      await deleteRecipe(recipeToDelete.id)
      if (selectedRecipe?.id === recipeToDelete.id) {
        handleDeletedTransition()
      }
      setRecipeToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <TooltipProvider delay={200}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Main Content Router */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          {/* VIEW 1: Recipes Catalog */}
          {currentView === 'recipes' && (
            <RecipesCatalogPage
              recipes={recipes}
              filteredRecipes={filteredRecipes}
              categories={categories}
              templates={templates}
              violationsMap={violationsMap}
              loading={loading}
              filterCriteria={filterCriteria}
              activeFiltersCount={activeFiltersCount}
              onFilterCriteriaChange={setFilterCriteria}
              onResetFilters={resetFilters}
              onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
              onNewRecipe={() => navigateTo('recipe-form', null)}
              onOpenSettings={() => navigateTo('settings', null)}
              onViewRecipe={(recipe) => navigateTo('recipe-view', recipe)}
              onEditRecipe={(recipe) => navigateTo('recipe-form', recipe)}
              onDeleteRequest={(recipe) => setRecipeToDelete(recipe)}
            />
          )}

          {/* VIEW 2: Recipe Detail View */}
          {currentView === 'recipe-view' && selectedRecipe && (
            <RecipeViewPage
              recipe={selectedRecipe}
              categories={categories}
              template={
                templates.find(
                  (t) => t.id === (selectedRecipe.template_id || 'tpl_default')
                ) || templates[0] || null
              }
              onBack={handleBack}
              onEdit={(recipe) => navigateTo('recipe-form', recipe)}
              onDeleteRequest={(recipe) => setRecipeToDelete(recipe)}
            />
          )}

          {/* VIEW 3: Recipe Form (Create / Edit) */}
          {currentView === 'recipe-form' && (
            <RecipeFormPage
              recipe={selectedRecipe}
              categories={categories}
              metadataConfig={metadataConfig}
              templates={templates}
              onBack={handleBack}
              onSave={handleSaveRecipe}
            />
          )}

          {/* VIEW 4: Settings & Configuration */}
          {currentView === 'settings' && (
            <SettingsPage
              metadataConfig={metadataConfig}
              categories={categories}
              onSaveConfig={saveConfig}
              onRefreshCategories={fetchCategories}
              onBack={() => navigateTo('recipes', null)}
            />
          )}
        </main>

        {/* Global Filter Drawer */}
        <FilterDrawer
          open={filterDrawerOpen}
          onOpenChange={setFilterDrawerOpen}
          criteria={filterCriteria}
          onChange={setFilterCriteria}
          categories={categories}
          allIngredients={allIngredients}
          matchCount={filteredRecipes.length}
          totalCount={recipes.length}
        />

        {/* Global Confirmation Modal for Recipe Deletion */}
        <ConfirmDeleteDialog
          open={!!recipeToDelete}
          onOpenChange={(open) => {
            if (!open) setRecipeToDelete(null)
          }}
          title="Delete Recipe"
          description={`Are you sure you want to permanently delete "${recipeToDelete?.title}"? This cannot be undone.`}
          confirmText="Delete Recipe"
          loading={deleting}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </TooltipProvider>
  )
}

export default App

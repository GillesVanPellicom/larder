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
import { useTemplatesData } from '@/hooks/useTemplatesData'
import { useTheme } from '@/hooks/useTheme'
import { useAppKeyboardShortcuts } from '@/hooks/useAppKeyboardShortcuts'

export function App() {
  useTheme()
  const {
    currentView,
    selectedRecipe,
    updateRecipe,
    navigateTo,
    handleBack,
    handleDeletedTransition,
  } = useNavigation()

  const { templates } = useTemplatesData()

  const {
    recipes,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    filterCriteria,
    setFilterCriteria,
    resetFilters,
    activeFiltersCount,
    allIngredients,
    categories,
    metadataConfig,
    violationsMap,
    isDatabaseConnected,
    loading,
    loadAll,
    saveRecipe,
    deleteRecipe,
    saveConfig,
    fetchCategories,
  } = useRecipesData()

  // Drawer & Deletion Dialog States
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'rules' | 'appearance' | 'integrations'>('rules')

  // Global Keyboard Shortcuts (Cmd+F / Ctrl+F, Cmd+N / Ctrl+N)
  useAppKeyboardShortcuts({
    onToggleFilters: () => setFilterDrawerOpen((prev) => !prev),
    onNewRecipe: () => navigateTo('recipe-form', null),
  })

  // Save recipe wrapper
  const handleSaveRecipe = async (data: CreateRecipeDTO, id?: number) => {
    const saved = await saveRecipe(data, id)
    updateRecipe(saved)
    return saved
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

  // Toggle tag filter selection from card
  const handleToggleTagFilter = (catId: string, tag: string) => {
    setFilterCriteria((prev) => {
      const currentTags = prev.selectedTags[catId] || []
      const isSelected = currentTags.includes(tag)
      const nextTags = isSelected
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag]

      const nextSelectedTags = { ...prev.selectedTags }
      if (nextTags.length === 0) {
        delete nextSelectedTags[catId]
      } else {
        nextSelectedTags[catId] = nextTags
      }

      return {
        ...prev,
        selectedTags: nextSelectedTags,
      }
    })
  }

  // Filter by tag and navigate to search/catalog from details page
  const handleFilterByTagAndNavigate = (catId: string, tag: string) => {
    setFilterCriteria((prev) => {
      const currentTags = prev.selectedTags[catId] || []
      const nextTags = currentTags.includes(tag) ? currentTags : [...currentTags, tag]
      return {
        ...prev,
        selectedTags: {
          ...prev.selectedTags,
          [catId]: nextTags,
        },
      }
    })
    navigateTo('recipes', null)
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
              totalCount={totalCount}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              categories={categories}
              templates={templates}
              violationsMap={violationsMap}
              loading={loading}
              isDatabaseConnected={isDatabaseConnected}
              filterCriteria={filterCriteria}
              activeFiltersCount={activeFiltersCount}
              timeTrackingMode={metadataConfig?.timeTrackingMode || 'prep_and_cook'}
              onFilterCriteriaChange={setFilterCriteria}
              onToggleTag={handleToggleTagFilter}
              onResetFilters={resetFilters}
              onOpenFilterDrawer={() => setFilterDrawerOpen(true)}
              onNewRecipe={() => navigateTo('recipe-form', null)}
              onOpenSettings={(tab) => {
                if (tab) setSettingsTab(tab)
                navigateTo('settings', null)
              }}
              onViewRecipe={(recipe) => navigateTo('recipe-view', recipe)}
              onEditRecipe={(recipe) => navigateTo('recipe-form', recipe)}
              onDeleteRequest={(recipe) => setRecipeToDelete(recipe)}
            />
          )}

          {/* Derive most up-to-date recipe object from recipes catalog if available */}
          {(() => {
            const activeRecipe = selectedRecipe
              ? recipes.find((r) => r.id === selectedRecipe.id) || selectedRecipe
              : null

            return (
              <>
                {/* VIEW 2: Recipe Detail View */}
                {currentView === 'recipe-view' && activeRecipe && (
                  <RecipeViewPage
                    recipe={activeRecipe}
                    categories={categories}
                    template={
                      templates.find(
                        (t) => t.id === (activeRecipe.template_id || 'tpl_default')
                      ) || templates[0] || null
                    }
                    timeTrackingMode={metadataConfig?.timeTrackingMode || 'prep_and_cook'}
                    onTagClick={handleFilterByTagAndNavigate}
                    onBack={handleBack}
                    onEdit={(recipe) => navigateTo('recipe-form', recipe)}
                    onDeleteRequest={(recipe) => setRecipeToDelete(recipe)}
                  />
                )}

                {/* VIEW 3: Recipe Form (Create / Edit) */}
                {currentView === 'recipe-form' && (
                  <RecipeFormPage
                    key={activeRecipe ? `recipe-edit-${activeRecipe.id}` : 'recipe-new'}
                    recipe={activeRecipe}
                    categories={categories}
                    metadataConfig={metadataConfig}
                    templates={templates}
                    onBack={handleBack}
                    onSave={handleSaveRecipe}
                  />
                )}
              </>
            )
          })()}

          {/* VIEW 4: Settings & Configuration */}
          {currentView === 'settings' && (
            <SettingsPage
              metadataConfig={metadataConfig}
              categories={categories}
              initialTab={settingsTab}
              onSaveConfig={saveConfig}
              onRefreshCategories={fetchCategories}
              onBack={() => {
                void loadAll()
                navigateTo('recipes', null)
              }}
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
          matchCount={totalCount}
          totalCount={totalCount}
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

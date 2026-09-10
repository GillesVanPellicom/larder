import { useState } from 'react'
import type { CreateRecipeDTO, Recipe } from '@/shared/types'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppHeader } from '@/components/navigation/AppHeader'
import { RecipesCatalogPage } from '@/components/catalog/RecipesCatalogPage'
import { RecipeViewPage } from '@/components/recipe-view/RecipeViewPage'
import { RecipeFormPage } from '@/components/recipe-form/RecipeFormPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { ShoppingListPage } from '@/components/shopping-list/ShoppingListPage'
import { FilterDrawer } from '@/components/filter-drawer/FilterDrawer'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useNavigation } from '@/hooks/useNavigation'
import { useRecipesData } from '@/hooks/useRecipesData'
import { useFilterTemplates } from '@/hooks/useFilterTemplates'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useTheme } from '@/hooks/useTheme'
import { useAppKeyboardShortcuts } from '@/hooks/useAppKeyboardShortcuts'
import { recipesApi } from '@/services/api'

export function App() {
  useTheme()
  const {
    currentView,
    selectedRecipe,
    settingsTab,
    shoppingListTab,
    updateRecipe,
    navigateTo,
    navigateToSettingsTab,
    navigateToShoppingListTab,
    handleBack,
    handleDeletedTransition,
  } = useNavigation()

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
    isDatabaseConnected,
    loading,
    saveRecipe,
    deleteRecipe,
    saveConfig,
    fetchCategories,
  } = useRecipesData()

  const {
    templates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
  } = useFilterTemplates()

  const {
    items: shoppingListItems,
    history: shoppingListHistory,
    storeAssignments,
    loading: shoppingListLoading,
    consolidated: consolidatedIngredients,
    uniqueIngredientsCount,
    isRecipeInShoppingList,
    getRecipeCheckedIngredients,
    getRecipeMultiplier,
    updateRecipeMultiplier,
    updateStoreAssignments,
    toggleRecipeInShoppingList,
    toggleIngredientInRecipe,
    toggleConsolidatedIngredient,
    removeFromShoppingList,
    clearShoppingList,
    loadHistorySnapshot,
    deleteHistorySnapshot,
  } = useShoppingList()

  // Drawer & Deletion Dialog States
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [filterDrawerTab, setFilterDrawerTab] = useState<'filters' | 'templates' | undefined>(undefined)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Global Keyboard Shortcuts (Cmd+F / Ctrl+F, Cmd+N / Ctrl+N)
  useAppKeyboardShortcuts({
    onToggleFilters: () => {
      setFilterDrawerTab(undefined)
      setFilterDrawerOpen((prev) => !prev)
    },
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

  // Navigate to recipe detail by ID (resolving cached recipe or fetching from API)
  const handleViewRecipeById = async (recipeId: number) => {
    const existing =
      recipes.find((r) => r.id === recipeId) ||
      shoppingListItems.find((i) => i.recipe_id === recipeId)?.recipe
    if (existing) {
      navigateTo('recipe-view', existing)
      return
    }
    try {
      const fullRecipe = await recipesApi.getById(recipeId)
      navigateTo('recipe-view', fullRecipe)
    } catch (err) {
      console.error('[App] Failed to load recipe by ID for view:', err)
    }
  }

  return (
    <TooltipProvider delay={200}>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-clip">
        {/* Main Content Router */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:px-6">
          {/* Universal Sticky Header */}
          <AppHeader
            currentView={currentView}
            onNavigate={(view) => {
              if (view === 'recipes') {
                resetFilters()
              }
              navigateTo(view, null)
            }}
            onOpenSettings={(tab) => navigateToSettingsTab(tab || 'info')}
            shoppingListCount={uniqueIngredientsCount}
            isDatabaseConnected={isDatabaseConnected}
          />

          {/* VIEW 1: Recipes Catalog */}
          {currentView === 'recipes' && (
            <RecipesCatalogPage
              recipes={recipes}
              totalCount={totalCount}
              totalPages={totalPages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              categories={categories}
              loading={loading}
              isDatabaseConnected={isDatabaseConnected}
              filterCriteria={filterCriteria}
              activeFiltersCount={activeFiltersCount}
              timeTrackingMode={metadataConfig?.timeTrackingMode || 'prep_and_cook'}
              templates={templates}
              onApplyTemplate={applyTemplate}
              onCreateTemplate={createTemplate}
              onFilterCriteriaChange={setFilterCriteria}
              onToggleTag={handleToggleTagFilter}
              onResetFilters={resetFilters}
              onOpenFilterDrawer={(tab) => {
                setFilterDrawerTab(tab === 'filters' || tab === 'templates' ? tab : undefined)
                setFilterDrawerOpen(true)
              }}
              onNewRecipe={() => navigateTo('recipe-form', null)}
              onOpenSettings={(tab) => navigateToSettingsTab(tab || 'info')}
              isRecipeInShoppingList={isRecipeInShoppingList}
              onToggleShoppingList={(recipe) => void toggleRecipeInShoppingList(recipe.id)}
              onViewRecipe={(recipe) => navigateTo('recipe-view', recipe)}
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
                    timeTrackingMode={metadataConfig?.timeTrackingMode || 'prep_and_cook'}
                    onTagClick={handleFilterByTagAndNavigate}
                    onBack={handleBack}
                    onEdit={(recipe) => navigateTo('recipe-form', recipe)}
                    onDeleteRequest={(recipe) => setRecipeToDelete(recipe)}
                    isInShoppingList={isRecipeInShoppingList(activeRecipe.id)}
                    initialYieldMultiplier={getRecipeMultiplier(activeRecipe.id)}
                    shoppingListCheckedIngredients={getRecipeCheckedIngredients(activeRecipe.id)}
                    onUpdateShoppingListMultiplier={(recipeId, mult) =>
                      void updateRecipeMultiplier(recipeId, mult)
                    }
                    onToggleShoppingListIngredient={(recipeId, itemKey) =>
                      void toggleIngredientInRecipe(recipeId, itemKey)
                    }
                    onToggleShoppingList={(recipe, checked, mult) =>
                      void toggleRecipeInShoppingList(recipe.id, checked, mult)
                    }
                  />
                )}

                {/* VIEW 3: Recipe Form (Create / Edit) */}
                {currentView === 'recipe-form' && (
                  <RecipeFormPage
                    key={activeRecipe ? `recipe-edit-${activeRecipe.id}` : 'recipe-new'}
                    recipe={activeRecipe}
                    categories={categories}
                    metadataConfig={metadataConfig}
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
              activeTab={settingsTab}
              onTabChange={navigateToSettingsTab}
              onSaveConfig={saveConfig}
              onRefreshCategories={fetchCategories}
            />
          )}

          {/* VIEW 5: Shopping List */}
          {currentView === 'shopping-list' && (
            <ShoppingListPage
              items={shoppingListItems}
              history={shoppingListHistory}
              loading={shoppingListLoading}
              consolidated={consolidatedIngredients}
              uniqueIngredientsCount={uniqueIngredientsCount}
              storeAssignments={storeAssignments}
              onUpdateStoreAssignments={updateStoreAssignments}
              categories={categories}
              timeTrackingMode={metadataConfig?.timeTrackingMode}
              activeTab={shoppingListTab}
              onTabChange={navigateToShoppingListTab}
              isRecipeInShoppingList={isRecipeInShoppingList}
              onToggleShoppingListRecipe={toggleRecipeInShoppingList}
              onToggleIngredientInRecipe={toggleIngredientInRecipe}
              onToggleConsolidatedIngredient={toggleConsolidatedIngredient}
              onUpdateRecipeMultiplier={updateRecipeMultiplier}
              onRemoveRecipe={removeFromShoppingList}
              onClearList={clearShoppingList}
              onLoadHistory={loadHistorySnapshot}
              onDeleteHistory={deleteHistorySnapshot}
              onViewRecipe={(recipe) => navigateTo('recipe-view', recipe)}
              onViewRecipeById={handleViewRecipeById}
              onNavigateToCatalog={() => navigateTo('recipes', null)}
            />
          )}

          {/* VIEW 6: Ingredients Table (redirected to Settings tab) */}
          {currentView === 'ingredients' && (
            <SettingsPage
              metadataConfig={metadataConfig}
              categories={categories}
              activeTab="ingredients"
              onTabChange={navigateToSettingsTab}
              onSaveConfig={saveConfig}
              onRefreshCategories={fetchCategories}
            />
          )}

          {/* VIEW 7: Stores Table (redirected to Settings tab) */}
          {currentView === 'stores' && (
            <SettingsPage
              metadataConfig={metadataConfig}
              categories={categories}
              activeTab="stores"
              onTabChange={navigateToSettingsTab}
              onSaveConfig={saveConfig}
              onRefreshCategories={fetchCategories}
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
          templates={templates}
          onApplyTemplate={applyTemplate}
          onCreateTemplate={createTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={deleteTemplate}
          initialTab={filterDrawerTab}
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

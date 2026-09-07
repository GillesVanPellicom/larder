import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CreateRecipeDTO,
  FilterCriteria,
  MetadataConfig,
  Recipe,
  RecipeConflict,
  TagCategory,
} from '@/shared/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDrawer } from '@/components/FilterDrawer'
import { RecipeCard } from '@/components/RecipeCard'
import { RecipeViewPage } from '@/components/RecipeViewPage'
import { RecipeFormPage } from '@/components/RecipeFormPage'
import { SettingsPage } from '@/components/SettingsPage'
import { ConflictsView } from '@/components/ConflictsView'
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { usePwa } from '@/hooks/usePwa'
import { useTheme } from '@/hooks/useTheme'
import {
  AlertTriangle,
  BookOpen,
  Download,
  Filter,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Utensils,
  X,
} from 'lucide-react'

type PageView = 'recipes' | 'recipe-view' | 'recipe-form' | 'conflicts' | 'settings'

export function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [metadataConfig, setMetadataConfig] = useState<MetadataConfig | null>(null)
  const [conflicts, setConflicts] = useState<RecipeConflict[]>([])
  const [loading, setLoading] = useState(true)

  // Page View state
  const [currentView, setCurrentView] = useState<PageView>('recipes')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [recipeToDelete, setRecipeToDelete] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Drawer
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  // Theme & PWA hooks
  const { theme, toggleTheme } = useTheme()
  const { canInstall, triggerInstall } = usePwa()

  // Filter Criteria
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    searchQuery: '',
    matchModePerElement: {
      ingredients: 'any',
      tags: 'all',
      categoryTags: {},
    },
    selectedIngredients: [],
    selectedTags: {},
    maxTotalTime: undefined,
    maxPrepTime: undefined,
    maxCookTime: undefined,
    hasImage: null,
    onlyConflicts: false,
  })

  // Data fetching
  const fetchRecipes = async () => {
    try {
      const res = await fetch('/api/recipes')
      if (res.ok) {
        const data = await res.json()
        setRecipes(data)
      }
    } catch (err) {
      console.error('Failed to load recipes:', err)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/tags')
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error('Failed to load tag categories:', err)
    }
  }

  const fetchMetadataConfig = async () => {
    try {
      const res = await fetch('/api/config')
      if (res.ok) {
        const data = await res.json()
        setMetadataConfig(data)
      }
    } catch (err) {
      console.error('Failed to load metadata config:', err)
    }
  }

  const fetchConflicts = async () => {
    try {
      const res = await fetch('/api/conflicts')
      if (res.ok) {
        const data = await res.json()
        setConflicts(data.conflicts || [])
      }
    } catch (err) {
      console.error('Failed to load conflicts:', err)
    }
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.allSettled([
      fetchRecipes(),
      fetchCategories(),
      fetchMetadataConfig(),
      fetchConflicts(),
    ])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  // Keyboard shortcuts (Cmd+K, Cmd+F, Cmd+N, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setFilterDrawerOpen(true)
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setFilterDrawerOpen((prev) => !prev)
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        setSelectedRecipe(null)
        setCurrentView('recipe-form')
        return
      }

      if (!isInput) {
        if (e.key === 'n') {
          e.preventDefault()
          setSelectedRecipe(null)
          setCurrentView('recipe-form')
        } else if (e.key === 'f') {
          e.preventDefault()
          setFilterDrawerOpen(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // All ingredients list for filter drawer
  const allIngredients = useMemo(() => {
    const set = new Set<string>()
    for (const r of recipes) {
      for (const ing of r.ingredients || []) {
        if (ing.name?.trim()) set.add(ing.name.trim().toLowerCase())
      }
    }
    return Array.from(set).sort()
  }, [recipes])

  // Violations Map
  const violationsMap = useMemo(() => {
    const map = new Map<number, RecipeConflict['violations']>()
    for (const c of conflicts) {
      map.set(c.recipe.id, c.violations)
    }
    return map
  }, [conflicts])

  // Filter Engine (Per-element Any/All)
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      if (filterCriteria.searchQuery.trim()) {
        const q = filterCriteria.searchQuery.toLowerCase().trim()
        const titleMatch = recipe.title.toLowerCase().includes(q)
        const descMatch = (recipe.description || '').toLowerCase().includes(q)
        const notesMatch = (recipe.notes || '').toLowerCase().includes(q)
        const ingredientMatch = (recipe.ingredients || []).some((i) =>
          i.name.toLowerCase().includes(q)
        )
        const instructionMatch =
          typeof recipe.instructions === 'string'
            ? recipe.instructions.toLowerCase().includes(q)
            : Array.isArray(recipe.instructions)
            ? (recipe.instructions as Array<{ text?: string } | string>).some((item) => {
                if (typeof item === 'string') return item.toLowerCase().includes(q)
                return Boolean(item?.text && item.text.toLowerCase().includes(q))
              })
            : false

        if (!titleMatch && !descMatch && !notesMatch && !ingredientMatch && !instructionMatch) {
          return false
        }
      }

      if (
        filterCriteria.maxTotalTime !== undefined &&
        recipe.total_time_minutes > filterCriteria.maxTotalTime
      ) {
        return false
      }

      if (filterCriteria.hasImage === true && (!recipe.image_url || !recipe.image_url.trim())) {
        return false
      }

      const hasConflict = violationsMap.has(recipe.id)
      if (filterCriteria.onlyConflicts && !hasConflict) {
        return false
      }

      if (filterCriteria.selectedIngredients.length > 0) {
        const recipeIngNames = (recipe.ingredients || []).map((i) => i.name.toLowerCase().trim())
        const mode = filterCriteria.matchModePerElement.ingredients

        if (mode === 'all') {
          const hasAll = filterCriteria.selectedIngredients.every((target) =>
            recipeIngNames.some((n) => n.includes(target))
          )
          if (!hasAll) return false
        } else {
          const hasAny = filterCriteria.selectedIngredients.some((target) =>
            recipeIngNames.some((n) => n.includes(target))
          )
          if (!hasAny) return false
        }
      }

      const selectedCatEntries = Object.entries(filterCriteria.selectedTags)
      if (selectedCatEntries.length > 0) {
        for (const [catId, wantedTags] of selectedCatEntries) {
          if (!wantedTags || wantedTags.length === 0) continue
          const recipeTagsInCat = recipe.tags?.[catId] || []
          const catMode = filterCriteria.matchModePerElement.categoryTags[catId] || 'any'

          if (catMode === 'all') {
            const hasAllTags = wantedTags.every((w) => recipeTagsInCat.includes(w))
            if (!hasAllTags) return false
          } else {
            const hasAnyTag = wantedTags.some((w) => recipeTagsInCat.includes(w))
            if (!hasAnyTag) return false
          }
        }
      }

      return true
    })
  }, [recipes, filterCriteria, violationsMap])

  // Save recipe
  const handleSaveRecipe = async (data: CreateRecipeDTO, id?: number) => {
    const url = id ? `/api/recipes/${id}` : '/api/recipes'
    const method = id ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to save recipe')
    }

    const saved = await res.json()
    await Promise.all([fetchRecipes(), fetchConflicts()])

    // If currently viewing or editing, show the saved recipe in view mode
    setSelectedRecipe(saved)
    setCurrentView('recipe-view')
  }

  // Delete recipe confirmation
  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/recipes/${recipeToDelete.id}`, { method: 'DELETE' })
      if (res.ok) {
        await Promise.all([fetchRecipes(), fetchConflicts()])
        if (selectedRecipe?.id === recipeToDelete.id) {
          setSelectedRecipe(null)
          setCurrentView('recipes')
        }
        setRecipeToDelete(null)
      }
    } finally {
      setDeleting(false)
    }
  }

  // Save metadata rules
  const handleSaveConfig = async (newConfig: MetadataConfig) => {
    const res = await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    })
    if (res.ok) {
      const data = await res.json()
      setMetadataConfig(data)
      await fetchConflicts()
    }
  }

  const activeFiltersCount =
    (filterCriteria.searchQuery ? 1 : 0) +
    filterCriteria.selectedIngredients.length +
    Object.values(filterCriteria.selectedTags).reduce((acc, tags) => acc + tags.length, 0) +
    (filterCriteria.maxTotalTime ? 1 : 0) +
    (filterCriteria.hasImage !== null ? 1 : 0) +
    (filterCriteria.onlyConflicts ? 1 : 0)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Single Merged Header Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md shadow-2xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* Navigation Tabs (Merged into single header) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setCurrentView('recipes')}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentView === 'recipes'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Recipes</span>
              <span className="rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[10px] font-mono">
                {filteredRecipes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('conflicts')}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentView === 'conflicts'
                  ? 'bg-destructive text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <AlertTriangle
                className={`h-3.5 w-3.5 ${
                  conflicts.length > 0 ? 'text-destructive' : 'text-muted-foreground'
                }`}
              />
              <span>Conflicts</span>
              {conflicts.length > 0 && (
                <span className="rounded-full bg-destructive/15 text-destructive px-1.5 py-0.2 text-[10px] font-bold">
                  {conflicts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className={`flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-foreground text-background shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Search on Recipes tab */}
            {currentView === 'recipes' && (
              <div className="relative hidden md:block w-48 lg:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search recipes... (Cmd+F)"
                  value={filterCriteria.searchQuery}
                  onChange={(e) =>
                    setFilterCriteria({ ...filterCriteria, searchQuery: e.target.value })
                  }
                  className="pl-8 h-8 text-xs bg-muted/30 border-border"
                />
                {filterCriteria.searchQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterCriteria({ ...filterCriteria, searchQuery: '' })}
                    className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Filter Drawer Trigger */}
            {currentView === 'recipes' && (
              <Button
                variant={activeFiltersCount > 0 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterDrawerOpen(true)}
                className="h-8 text-xs cursor-pointer border-border hover:bg-muted"
                title="Filter Drawer (F or Cmd+F)"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-neutral-900">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            )}

            {/* New Recipe Action */}
            <Button
              size="sm"
              onClick={() => {
                setSelectedRecipe(null)
                setCurrentView('recipe-form')
              }}
              className="h-8 text-xs cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
              title="New Recipe (N or Cmd+N)"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>New Recipe</span>
            </Button>

            {/* Light / Dark Mode Toggle Button */}
            <Button
              variant="outline"
              size="icon-sm"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              className="h-8 w-8 cursor-pointer border-border hover:bg-muted text-foreground"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-neutral-700" />
              )}
            </Button>

            {/* PWA Install Button if available */}
            {canInstall && (
              <Button
                variant="outline"
                size="icon-sm"
                onClick={triggerInstall}
                title="Install Larder as an App"
                className="h-8 w-8 cursor-pointer border-amber-500 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {/* VIEW 1: Recipes Catalog */}
        {currentView === 'recipes' && (
          <div className="space-y-6">
            {/* Active Filters Bar */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card p-3 text-xs shadow-2xs">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mr-1">
                  Active Filters:
                </span>

                {filterCriteria.searchQuery && (
                  <Badge variant="secondary" className="gap-1 py-0.5 text-xs">
                    <span>&ldquo;{filterCriteria.searchQuery}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => setFilterCriteria({ ...filterCriteria, searchQuery: '' })}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filterCriteria.maxTotalTime && (
                  <Badge variant="secondary" className="gap-1 py-0.5 text-xs">
                    <span>&le; {filterCriteria.maxTotalTime}m</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFilterCriteria({ ...filterCriteria, maxTotalTime: undefined })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filterCriteria.selectedIngredients.map((ing) => (
                  <Badge key={ing} variant="secondary" className="gap-1 py-0.5 text-xs">
                    <span>Ing: {ing}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFilterCriteria({
                          ...filterCriteria,
                          selectedIngredients: filterCriteria.selectedIngredients.filter(
                            (i) => i !== ing
                          ),
                        })
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {Object.entries(filterCriteria.selectedTags).map(([catId, tags]) =>
                  tags.map((tag) => (
                    <Badge key={`${catId}-${tag}`} variant="secondary" className="gap-1 py-0.5 text-xs">
                      <span>
                        {catId}: {tag}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = tags.filter((t) => t !== tag)
                          const next = { ...filterCriteria.selectedTags }
                          if (updated.length > 0) next[catId] = updated
                          else delete next[catId]
                          setFilterCriteria({ ...filterCriteria, selectedTags: next })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}

                <button
                  type="button"
                  onClick={() =>
                    setFilterCriteria({
                      searchQuery: '',
                      matchModePerElement: {
                        ingredients: 'any',
                        tags: 'all',
                        categoryTags: {},
                      },
                      selectedIngredients: [],
                      selectedTags: {},
                      maxTotalTime: undefined,
                      maxPrepTime: undefined,
                      maxCookTime: undefined,
                      hasImage: null,
                      onlyConflicts: false,
                    })
                  }
                  className="text-muted-foreground hover:text-foreground ml-auto font-medium text-xs underline cursor-pointer"
                >
                  Reset all
                </button>
              </div>
            )}

            {/* Recipes Grid */}
            {loading && recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 bg-card">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Loading culinary recipes...</p>
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card">
                <Utensils className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-4 text-base font-bold text-foreground">No recipes matched</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Try adjusting filters, search keywords, or add a new recipe to your collection.
                </p>
                <div className="mt-5 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilterCriteria({
                        searchQuery: '',
                        matchModePerElement: {
                          ingredients: 'any',
                          tags: 'all',
                          categoryTags: {},
                        },
                        selectedIngredients: [],
                        selectedTags: {},
                        maxTotalTime: undefined,
                        maxPrepTime: undefined,
                        maxCookTime: undefined,
                        hasImage: null,
                        onlyConflicts: false,
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRecipe(null)
                      setCurrentView('recipe-form')
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Recipe
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    violations={violationsMap.get(recipe.id)}
                    categories={categories}
                    onView={(r) => {
                      setSelectedRecipe(r)
                      setCurrentView('recipe-view')
                    }}
                    onEdit={(r) => {
                      setSelectedRecipe(r)
                      setCurrentView('recipe-form')
                    }}
                    onDeleteRequest={(r) => setRecipeToDelete(r)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Full Recipe View Page */}
        {currentView === 'recipe-view' && selectedRecipe && (
          <RecipeViewPage
            recipe={selectedRecipe}
            categories={categories}
            onBack={() => setCurrentView('recipes')}
            onEdit={(r) => {
              setSelectedRecipe(r)
              setCurrentView('recipe-form')
            }}
            onDeleteRequest={(r) => setRecipeToDelete(r)}
          />
        )}

        {/* VIEW 3: Full Recipe Form Page */}
        {currentView === 'recipe-form' && (
          <RecipeFormPage
            recipe={selectedRecipe}
            categories={categories}
            metadataConfig={metadataConfig}
            onBack={() => {
              if (selectedRecipe) {
                setCurrentView('recipe-view')
              } else {
                setCurrentView('recipes')
              }
            }}
            onSave={handleSaveRecipe}
          />
        )}

        {/* VIEW 4: Dedicated Conflicts Page */}
        {currentView === 'conflicts' && (
          <ConflictsView
            conflicts={conflicts}
            loading={loading}
            onRefresh={fetchConflicts}
            onFixRecipe={(r) => {
              setSelectedRecipe(r)
              setCurrentView('recipe-form')
            }}
            onOpenConfig={() => setCurrentView('settings')}
          />
        )}

        {/* VIEW 5: Settings Page (Metadata Rules + Tags & Taxonomy) */}
        {currentView === 'settings' && (
          <SettingsPage
            metadataConfig={metadataConfig}
            categories={categories}
            onSaveConfig={handleSaveConfig}
            onRefreshCategories={fetchCategories}
          />
        )}
      </main>

      {/* Filter Drawer */}
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

      {/* Reusable Destructive Confirmation Modal for Deletion */}
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
  )
}

export default App

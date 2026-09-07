import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { CatalogToolbar } from '@/components/catalog/CatalogToolbar'
import type { PageView } from '@/hooks/useNavigation'
import type { Recipe, RecipeTemplate } from '@/shared/types'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Pencil,
  RefreshCw,
  Sliders,
  Trash2,
} from 'lucide-react'

interface SubHeaderProps {
  currentView: PageView
  // Recipes view props
  searchQuery: string
  onSearchChange: (query: string) => void
  activeFiltersCount: number
  onResetFilters: () => void
  onOpenFilterDrawer: () => void
  // Recipe details & form common props
  selectedRecipe: Recipe | null
  selectedTemplate?: RecipeTemplate | null
  onBack: () => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
  // Conflicts view props
  onRefreshConflicts?: () => Promise<void>
  onOpenConfig?: () => void
}

export function SubHeader({
  currentView,
  searchQuery,
  onSearchChange,
  activeFiltersCount,
  onResetFilters,
  onOpenFilterDrawer,
  selectedRecipe,
  selectedTemplate,
  onBack,
  onEdit,
  onDeleteRequest,
  onRefreshConflicts,
  onOpenConfig,
}: SubHeaderProps) {
  return (
    <div className="sticky top-14 z-20 w-full border-b border-border/80 bg-muted/50 dark:bg-zinc-950/90 backdrop-blur-md shadow-2xs py-2 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* CASE 1: Recipes Page SubHeader (Search bar and Filter buttons) */}
        {currentView === 'recipes' && (
          <CatalogToolbar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            activeFiltersCount={activeFiltersCount}
            onResetFilters={onResetFilters}
            onOpenFilterDrawer={onOpenFilterDrawer}
          />
        )}

        {/* CASE 2: Recipe Details Page SubHeader (Back and ButtonGroup) */}
        {currentView === 'recipe-view' && selectedRecipe && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                title="Back to Recipes"
                className="h-8 w-8 cursor-pointer border-border hover:bg-muted text-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                {selectedRecipe.title}
              </span>
            </div>

            <ButtonGroup orientation="horizontal" className="border border-border rounded-lg bg-card shadow-xs">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onEdit(selectedRecipe)}
                title="Edit recipe"
                className="h-8 w-8 text-foreground hover:bg-muted cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDeleteRequest(selectedRecipe)}
                title="Delete recipe"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </ButtonGroup>
          </div>
        )}

        {/* CASE 3: Edit / Create Recipe Page SubHeader (Back, cancel, outline-style Save Changes) */}
        {currentView === 'recipe-form' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                title="Cancel and Back"
                className="h-8 w-8 cursor-pointer border-border hover:bg-muted text-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-foreground">
                {selectedRecipe ? `Edit "${selectedRecipe.title}"` : 'New Recipe'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>

              {/* Save Changes button in subheader MUST be variant="outline" as requested */}
              <Button
                type="submit"
                form="recipe-form"
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold cursor-pointer border-border bg-card hover:bg-muted text-foreground"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {selectedRecipe ? 'Save Changes' : 'Create Recipe'}
              </Button>
            </div>
          </div>
        )}

        {/* CASE 4: Conflicts View SubHeader */}
        {currentView === 'conflicts' && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Metadata Conflicts Dashboard</span>
            </span>

            <div className="flex items-center gap-2">
              {onRefreshConflicts && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefreshConflicts}
                  className="h-8 text-xs border-border cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Re-check
                </Button>
              )}
              {onOpenConfig && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenConfig}
                  className="h-8 text-xs cursor-pointer"
                >
                  <Sliders className="h-3 w-3 mr-1" /> Edit Rules
                </Button>
              )}
            </div>
          </div>
        )}

        {/* CASE 5: Settings Page SubHeader */}
        {currentView === 'settings' && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Settings &amp; Preferences</span>
            <span>Configure system rules, taxonomies, and sub header preferences</span>
          </div>
        )}

        {/* CASE 6: Template Editor SubHeader */}
        {currentView === 'template-editor' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={onBack}
                title="Back to Settings"
                className="h-8 w-8 cursor-pointer border-border hover:bg-muted text-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-semibold text-foreground">
                {selectedTemplate ? `Template: ${selectedTemplate.name}` : 'New Recipe Template'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

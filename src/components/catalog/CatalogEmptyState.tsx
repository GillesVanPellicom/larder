import { Button } from '@/components/ui/button'
import { Plus, RotateCcw, Utensils } from 'lucide-react'

interface CatalogEmptyStateProps {
  hasRecipes?: boolean
  onResetFilters: () => void
  onNewRecipe: () => void
}

export function CatalogEmptyState({
  hasRecipes = true,
  onResetFilters,
  onNewRecipe,
}: CatalogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 my-auto">
      <Utensils className="h-12 w-12 text-muted-foreground/35" />
      <h3 className="mt-4 text-base sm:text-lg font-semibold text-foreground">
        {hasRecipes ? 'No recipes matched' : 'No recipes yet'}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
        {hasRecipes
          ? "Try adjusting your search or active filters to find what you're looking for."
          : 'Add your first recipe to get started with your culinary collection.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {hasRecipes && (
          <Button variant="outline" size="default" onClick={onResetFilters} className="cursor-pointer">
            <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
          </Button>
        )}
        <Button size="default" onClick={onNewRecipe} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" /> New
        </Button>
      </div>
    </div>
  )
}

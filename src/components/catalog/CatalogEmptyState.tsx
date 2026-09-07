import { Button } from '@/components/ui/button'
import { Plus, Utensils } from 'lucide-react'

interface CatalogEmptyStateProps {
  onResetFilters: () => void
  onNewRecipe: () => void
}

export function CatalogEmptyState({
  onResetFilters,
  onNewRecipe,
}: CatalogEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card">
      <Utensils className="h-12 w-12 text-muted-foreground/40" />
      <h3 className="mt-4 text-base font-bold text-foreground">No recipes matched</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        Try adjusting filters, search keywords, or add a new recipe to your collection.
      </p>
      <div className="mt-5 flex gap-2">
        <Button variant="outline" size="sm" onClick={onResetFilters}>
          Clear Filters
        </Button>
        <Button size="sm" onClick={onNewRecipe}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Recipe
        </Button>
      </div>
    </div>
  )
}

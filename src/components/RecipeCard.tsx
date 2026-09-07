import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Recipe, RecipeViolation, TagCategory } from '@/shared/types'
import {
  AlertTriangle,
  Clock,
  Info,
  Pencil,
  Trash2,
  Utensils,
} from 'lucide-react'

interface RecipeCardProps {
  recipe: Recipe
  violations?: RecipeViolation[]
  categories: TagCategory[]
  onView: (recipe: Recipe) => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
}

export function RecipeCard({
  recipe,
  violations = [],
  categories,
  onView,
  onEdit,
  onDeleteRequest,
}: RecipeCardProps) {
  const hasViolations = violations.length > 0
  const ingredientCount = recipe.ingredients?.length || 0

  return (
    <Card
      onClick={() => onView(recipe)}
      className="group relative flex flex-col justify-between overflow-hidden transition-all duration-150 hover:brightness-105 dark:hover:brightness-110 cursor-pointer border border-border bg-card text-card-foreground shadow-xs select-none"
    >
      <div>
        {/* Media Container */}
        <div className="relative h-44 w-full overflow-hidden bg-muted/60">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center bg-muted/30">
              <Utensils className="h-8 w-8 text-muted-foreground/40" />
              <span className="mt-1.5 text-xs text-muted-foreground">
                No image
              </span>
            </div>
          )}

          {/* Top-Left: Error Badge (Larger, icon only, hover shows violations) */}
          {hasViolations && (
            <div
              className="absolute top-2.5 left-2.5 z-20 group/err"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-destructive text-white shadow-md backdrop-blur-xs transition-transform hover:scale-105 cursor-help">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>

              {/* Hover Tooltip with Violations */}
              <div className="pointer-events-none absolute top-full left-0 mt-1.5 hidden group-hover/err:block z-40 w-64 p-3 rounded-xl bg-popover/95 border border-border shadow-xl backdrop-blur-md text-xs text-popover-foreground animate-in fade-in zoom-in-95">
                <div className="font-bold text-destructive flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{violations.length} Metadata Violation{violations.length > 1 ? 's' : ''}</span>
                </div>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside text-[11px] leading-relaxed">
                  {violations.map((v, i) => (
                    <li key={i}>{v.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Top-Right: Cohesive Action ButtonGroup (Hover-only, on opposite side so it never shifts badge) */}
          <div
            className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inline-flex items-center rounded-lg border border-white/20 bg-black/75 backdrop-blur-md p-0.5 shadow-md">
              <button
                type="button"
                onClick={() => onEdit(recipe)}
                title="Edit recipe"
                className="flex h-8 w-8 items-center justify-center rounded-md text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                <Pencil className="h-4.5 w-4.5" />
              </button>
              <div className="h-4 w-px bg-white/20 my-auto" />
              <button
                type="button"
                onClick={() => onDeleteRequest(recipe)}
                title="Delete recipe"
                className="flex h-8 w-8 items-center justify-center rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1">
              {recipe.title}
            </CardTitle>

            {/* Info Icon with hover description (Replaces subtitle) */}
            {recipe.description && (
              <div
                className="relative group/info shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-help"
                  title="View description"
                >
                  <Info className="h-4 w-4" />
                </div>
                <div className="pointer-events-none absolute right-0 top-full mt-1 hidden group-hover/info:block z-30 w-56 p-2.5 rounded-xl bg-popover/95 border border-border shadow-lg backdrop-blur-md text-xs text-muted-foreground leading-relaxed animate-in fade-in zoom-in-95">
                  <span className="font-semibold text-foreground block mb-0.5">Overview</span>
                  {recipe.description}
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          {/* Classy Stats Strip: Total Time & Ingredient Count */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium py-1 px-2 rounded-lg bg-muted/40">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="font-semibold text-foreground">
                {recipe.total_time_minutes > 0 ? `${recipe.total_time_minutes}m` : '0m'}
              </span>
            </div>

            <span className="text-muted-foreground/40">•</span>

            <div className="flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span>
                <strong className="font-semibold text-foreground">{ingredientCount}</strong>{' '}
                {ingredientCount === 1 ? 'ingredient' : 'ingredients'}
              </span>
            </div>

            {recipe.yield_amount && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="truncate text-foreground/80">{recipe.yield_amount}</span>
              </>
            )}
          </div>

          {/* Tags */}
          {recipe.tags && Object.keys(recipe.tags).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(recipe.tags).map(([catId, tags]) => {
                const category = categories.find((c) => c.id === catId)
                return tags.map((tag) => (
                  <Badge
                    key={`${catId}-${tag}`}
                    variant="secondary"
                    className="text-[10px] font-normal px-1.5 py-0 h-4.5"
                  >
                    <span className="opacity-50 mr-1">{category?.name || catId}:</span>
                    <strong>{tag}</strong>
                  </Badge>
                ))
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

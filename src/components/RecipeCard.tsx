import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Recipe, RecipeTemplate, RecipeViolation, TagCategory, TimeTrackingMode } from '@/shared/types'
import {
  AlertTriangle,
  Clock,
  Pencil,
  ShoppingBasket,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react'

interface RecipeCardProps {
  recipe: Recipe
  violations?: RecipeViolation[]
  categories: TagCategory[]
  template?: RecipeTemplate | null
  timeTrackingMode?: TimeTrackingMode
  selectedTags?: Record<string, string[]>
  onToggleTag?: (catId: string, tag: string) => void
  onView: (recipe: Recipe) => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
}

export function RecipeCard({
  recipe,
  violations = [],
  categories,
  timeTrackingMode = 'prep_and_cook',
  selectedTags,
  onToggleTag,
  onView,
  onEdit,
  onDeleteRequest,
}: RecipeCardProps) {
  const hasViolations = violations.length > 0
  const ingredientCount = recipe.ingredients?.length || 0

  return (
    <Card
      onClick={() => onView(recipe)}
      className="group relative flex flex-col justify-between overflow-hidden p-0 pt-0 gap-0 transition-all duration-150 hover:brightness-105 dark:hover:brightness-110 cursor-pointer border border-border bg-card text-card-foreground shadow-xs select-none rounded-2xl"
    >
      {/* Top-Left: Error Badge */}
      {hasViolations && (
        <div
          className="absolute top-2.5 left-2.5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-destructive text-white shadow-md backdrop-blur-xs transition-transform hover:scale-105 cursor-help">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
              }
            />
            <TooltipContent side="bottom" align="start" className="w-64">
              <div className="font-bold text-destructive flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{violations.length} Data Rule Violation{violations.length > 1 ? 's' : ''}</span>
              </div>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside text-xs leading-relaxed">
                {violations.map((v, i) => (
                  <li key={i}>{v.message}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Top-Right: Cohesive Action ButtonGroup */}
      <div
        className="absolute top-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <ButtonGroup orientation="horizontal" className="bg-black/80 backdrop-blur-md rounded-lg p-0.5 shadow-md border border-white/20">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(recipe)}
            title="Edit"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeleteRequest(recipe)}
            title="Delete"
            className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>

      <div>
        {/* Media Container: Flush to top edge with rounded top corners */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-muted/60 rounded-t-2xl">
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

          {/* Time, Servings & Ingredients Badges over Image */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center gap-1.5 pointer-events-none">
            {timeTrackingMode !== 'no_cook' && recipe.total_time_minutes > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md border border-white/10">
                <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{recipe.total_time_minutes} min</span>
              </span>
            )}
            {Boolean(recipe.yield_amount) && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md border border-white/10">
                <Users className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{recipe.yield_amount} {recipe.yield_unit || 'servings'}</span>
              </span>
            )}
            {ingredientCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-md border border-white/10">
                <ShoppingBasket className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>{ingredientCount} {ingredientCount === 1 ? 'item' : 'items'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold tracking-tight text-foreground line-clamp-1">
            {recipe.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Tags */}
          {recipe.tags && Object.keys(recipe.tags).length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {Object.entries(recipe.tags).map(([catId, tags]) => {
                if (!tags || tags.length === 0) return null
                const category = categories.find((c) => c.id === catId)
                const categoryName = category?.name || catId

                return (
                  <div key={catId} className="flex flex-wrap items-center gap-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {categoryName}:
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {tags.map((tag) => {
                        const isSelected = Boolean(selectedTags?.[catId]?.includes(tag))

                        return (
                          <Badge
                            key={`${catId}-${tag}`}
                            variant="secondary"
                            onClick={(e) => {
                              if (onToggleTag) {
                                e.stopPropagation()
                                onToggleTag(catId, tag)
                              }
                            }}
                            title={
                              onToggleTag
                                ? isSelected
                                  ? `Deselect ${categoryName}: ${tag} filter`
                                  : `Filter by ${categoryName}: ${tag}`
                                : undefined
                            }
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-md border transition-all ${
                              onToggleTag ? 'cursor-pointer' : ''
                            } ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs hover:bg-primary/90'
                                : 'border-border/70 bg-muted/50 text-foreground hover:bg-muted hover:border-border'
                            }`}
                          >
                            {tag}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}


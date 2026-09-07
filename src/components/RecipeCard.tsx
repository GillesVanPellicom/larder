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
import { CardGridRenderer } from '@/components/template-engine/CardGridRenderer'
import type { Recipe, RecipeTemplate, RecipeViolation, TagCategory } from '@/shared/types'
import {
  AlertTriangle,
  Clock,
  Pencil,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react'

interface RecipeCardProps {
  recipe: Recipe
  violations?: RecipeViolation[]
  categories: TagCategory[]
  template?: RecipeTemplate | null
  onView: (recipe: Recipe) => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
}

export function RecipeCard({
  recipe,
  violations = [],
  categories,
  template,
  onView,
  onEdit,
  onDeleteRequest,
}: RecipeCardProps) {
  const hasViolations = violations.length > 0
  const ingredientCount = recipe.ingredients?.length || 0

  const hasCustomLayout = Boolean(
    template?.currentVersion?.cardLayout?.widgets &&
    template.currentVersion.cardLayout.widgets.length > 0
  )

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
                <span>{violations.length} Metadata Violation{violations.length > 1 ? 's' : ''}</span>
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
            title="Edit recipe"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDeleteRequest(recipe)}
            title="Delete recipe"
            className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>

      {hasCustomLayout ? (
        <CardGridRenderer
          cardLayout={template!.currentVersion!.cardLayout}
          fieldValues={
            recipe.field_values && Object.keys(recipe.field_values).length > 0
              ? {
                  ...recipe.field_values,
                  fld_image: recipe.field_values.fld_image || recipe.image_url,
                }
              : {
                  fld_title: recipe.title,
                  fld_description: recipe.description,
                  fld_yield: recipe.yield_amount,
                  fld_prep_time: recipe.prep_time_minutes,
                  fld_cook_time: recipe.cook_time_minutes,
                  fld_total_time: recipe.total_time_minutes,
                  fld_image: recipe.image_url,
                  fld_tags: recipe.tags,
                }
          }
          fieldsSchema={template!.currentVersion!.fieldsSchema}
        />
      ) : (
        <div>
          {/* Media Container: Flush to top edge with rounded top corners */}
          <div className="relative h-48 w-full overflow-hidden bg-muted/60 rounded-t-2xl">
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

            {/* Time & Yield Badges on Image */}
            <div className="absolute bottom-2.5 left-2.5 flex flex-wrap gap-1.5">
              {recipe.total_time_minutes > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-xs shadow-xs">
                  <Clock className="h-3.5 w-3.5 text-amber-400" />
                  <span>{recipe.total_time_minutes}m</span>
                </span>
              )}
              {recipe.yield_amount && (
                <span className="inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-xs shadow-xs">
                  <Users className="h-3.5 w-3.5 text-blue-300" />
                  <span>{recipe.yield_amount}</span>
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

        <CardContent className="p-4 pt-1 space-y-3">
          {/* Prominent Cook Time & Ingredients Feature Block */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-2.5 border border-border/60">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block truncate">
                  Cook Time
                </span>
                <span className="text-xs font-bold text-foreground truncate block">
                  {recipe.cook_time_minutes > 0
                    ? `${recipe.cook_time_minutes} min`
                    : recipe.total_time_minutes > 0
                    ? `${recipe.total_time_minutes} min`
                    : '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Utensils className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block truncate">
                  Ingredients
                </span>
                <span className="text-xs font-bold text-foreground truncate block">
                  {ingredientCount} item{ingredientCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          {/* Prominent Ingredients Summary */}
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
              <strong className="text-foreground font-semibold">Ingredients: </strong>
              {recipe.ingredients.map((i) => i.name).filter(Boolean).join(', ')}
            </p>
          )}

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
    )}
  </Card>
)
}

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import type { Recipe, RecipeViolation, TagCategory, TimeTrackingMode } from '@/shared/types'
import {
  AlertTriangle,
  Check,
  Clock,
  ShoppingBag,
  ShoppingBasket,
  Users,
  Utensils,
} from 'lucide-react'
import { cn } from 'cn'
import { useIsMobile } from '@/hooks/useIsMobile'
import { formatGracefulNumber, scaleYield } from '@/lib/recipeMath'

interface RecipeCardProps {
  recipe: Recipe
  violations?: RecipeViolation[]
  categories?: TagCategory[]
  timeTrackingMode?: TimeTrackingMode
  selectedTags?: Record<string, string[]>
  isInShoppingList?: boolean
  multiplier?: number
  onToggleShoppingList?: (recipe: Recipe) => void
  onToggleTag?: (catId: string, tag: string) => void
  onView: (recipe: Recipe) => void
}

export function RecipeCard({
  recipe,
  violations = recipe.violations || [],
  categories = [],
  timeTrackingMode = 'prep_and_cook',
  selectedTags,
  isInShoppingList = false,
  multiplier = 1,
  onToggleShoppingList,
  onToggleTag,
  onView,
}: RecipeCardProps) {
  const isMobile = useIsMobile()
  const hasViolations = violations.length > 0
  const ingredientCount = recipe.ingredients?.length || 0
  const isScaled = multiplier && Math.abs(multiplier - 1) > 0.001

  return (
    <Card
      onClick={() => onView(recipe)}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden p-0 pt-0 gap-0 transition-all duration-150 hover:brightness-105 dark:hover:brightness-110 cursor-pointer border border-border bg-card text-card-foreground shadow-xs select-none rounded-2xl",
        isInShoppingList && "ring-2 ring-primary/80 shadow-md shadow-primary/10 border-primary/50"
      )}
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
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-destructive text-white shadow-md backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer touch-manipulation">
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

      {/* Top-Right: Add to Shopping List Button */}
      <div
        className={cn(
          "absolute top-2.5 right-2.5 z-20 transition-opacity duration-150",
          isInShoppingList
            ? "opacity-100"
            : isMobile
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleShoppingList?.(recipe)}
                className={cn(
                  "h-8.5 w-8.5 rounded-lg backdrop-blur-md shadow-md border cursor-pointer transition-all",
                  isInShoppingList
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                    : isMobile
                      ? "bg-black/35 text-white/80 border-white/20 hover:bg-black/60 active:bg-black/80 active:scale-95"
                      : "bg-black/80 text-white border-white/20 hover:bg-black/90 hover:scale-105"
                )}
                aria-label={isInShoppingList ? "Remove from shopping list" : "Add to shopping list"}
              >
                {isInShoppingList ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <ShoppingBag className="h-4 w-4" />
                )}
              </Button>
            }
          />
          <TooltipContent side="bottom" align="end">
            {isInShoppingList ? "Remove from shopping list" : "Add to shopping list"}
          </TooltipContent>
        </Tooltip>
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
                <span>
                  {isScaled
                    ? scaleYield(recipe.yield_amount, multiplier, recipe.yield_unit) || `${recipe.yield_amount} ${recipe.yield_unit || 'servings'}`
                    : `${recipe.yield_amount} ${recipe.yield_unit || 'servings'}`}
                </span>
              </span>
            )}
            {isScaled && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/90 text-black px-2.5 py-1 text-xs font-bold shadow-md border border-amber-400/40">
                {formatGracefulNumber(multiplier)}×
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


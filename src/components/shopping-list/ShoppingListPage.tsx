import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import {
  Check,
  ChevronDown,
  Clock,
  History,
  ListFilter,
  Loader2,
  Minus,
  RotateCcw,
  Scale,
  ShoppingBag,
  Trash2,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { cn } from 'cn'
import type { ConsolidatedIngredient, Recipe, ShoppingListItem } from '@/shared/types'
import { formatRelativeDate } from '@/lib/dateTime'
import { scaleIngredients, scaleYield } from '@/lib/recipeMath'
import { YieldMultiplierDialog } from '@/components/recipe-view/YieldMultiplierDialog'

export interface ShoppingListPageProps {
  items: ShoppingListItem[]
  history: Array<{
    id: number
    recipe_ids: number[]
    recipe_titles: string[]
    ingredient_count: number
    created_at: string
  }>
  loading: boolean
  consolidated: ConsolidatedIngredient[]
  uniqueIngredientsCount: number
  onToggleIngredientInRecipe: (recipeId: number, itemKey: string) => Promise<void>
  onToggleConsolidatedIngredient: (ingredientName: string) => Promise<void>
  onUpdateRecipeMultiplier?: (recipeId: number, multiplier: number) => Promise<void>
  onRemoveRecipe: (recipeId: number) => Promise<void>
  onClearList: () => Promise<void>
  onLoadHistory: (historyId: number) => Promise<void>
  onDeleteHistory: (historyId: number) => Promise<void>
  onViewRecipe?: (recipe: Recipe) => void
  onViewRecipeById?: (recipeId: number) => void
  onNavigateToCatalog?: () => void
}

export function ShoppingListPage({
  items,
  history,
  loading,
  consolidated,
  uniqueIngredientsCount,
  onToggleIngredientInRecipe,
  onToggleConsolidatedIngredient,
  onUpdateRecipeMultiplier,
  onRemoveRecipe,
  onClearList,
  onLoadHistory,
  onDeleteHistory,
  onViewRecipe,
  onViewRecipeById,
  onNavigateToCatalog,
}: ShoppingListPageProps) {
  const [activeTab, setActiveTab] = useState<'per_recipe' | 'consolidated'>('per_recipe')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [openRecipeMap, setOpenRecipeMap] = useState<Record<number, boolean>>({})
  const [multiplierModalRecipe, setMultiplierModalRecipe] = useState<{
    recipeId: number
    multiplier: number
  } | null>(null)

  const handleToggleIngredient = (recipeId: number, itemKey: string) => {
    const item = items.find((i) => i.recipe_id === recipeId)
    if (item) {
      const checkedSet = new Set(item.checked_ingredients || [])
      const willBeChecked = !checkedSet.has(itemKey)
      const scaledIngs = scaleIngredients(item.recipe?.ingredients || [], item.multiplier || 1)

      // If this toggle completes the recipe (all ingredients checked), auto-close it
      if (willBeChecked) {
        const willAllBeChecked = scaledIngs.every((ing, idx) => {
          const k = String(ing.id ?? idx)
          return k === itemKey || checkedSet.has(k)
        })
        if (willAllBeChecked) {
          setOpenRecipeMap((prev) => ({ ...prev, [recipeId]: false }))
        }
      }
    }
    onToggleIngredientInRecipe(recipeId, itemKey)
  }

  const handleClear = async () => {
    if (items.length === 0) return
    try {
      setClearing(true)
      await onClearList()
    } finally {
      setClearing(false)
    }
  }

  const isEmpty = items.length === 0

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-32 sm:pb-36 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
              Shopping List
            </h1>
            <InfoTooltip content="Organize grocery ingredients by recipe or as a consolidated checklist. Changes are shared and synced in real-time." />
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-light">
            {items.length > 0
              ? `${items.length} recipe${items.length > 1 ? 's' : ''} • ${uniqueIngredientsCount} unique ingredient${uniqueIngredientsCount !== 1 ? 's' : ''}`
              : 'Add recipes to build your grocery checklist.'}
          </p>
        </div>

        {items.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleClear}
            disabled={clearing}
            className="text-muted-foreground hover:text-destructive hover:border-destructive/40 cursor-pointer shrink-0"
            title="Clear all recipes from the shopping list"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {/* Primary Tabs (replacing the divider with Settings-style tabs) */}
      <div className="flex items-center gap-2 sm:gap-6 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('per_recipe')}
          className={cn(
            'group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer',
            activeTab === 'per_recipe'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <Utensils className="h-4 w-4" />
          <span>Per recipe</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('consolidated')}
          className={cn(
            'group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer',
            activeTab === 'consolidated'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <ListFilter className="h-4 w-4" />
          <span>Consolidated</span>
        </button>
      </div>

      {/* Main View Area */}
      {loading && isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Loading shopping list...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center text-center px-4 py-16">
          <div className="mb-4 text-muted-foreground/40">
            <ShoppingBag className="h-12 w-12 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-medium text-foreground">
            Your shopping list is empty
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm font-light">
            Select recipes from the catalog or recipe details to automatically generate your grocery list.
          </p>
          {onNavigateToCatalog && (
            <Button
              type="button"
              onClick={onNavigateToCatalog}
              className="mt-5 cursor-pointer"
            >
              Browse recipes
            </Button>
          )}
        </div>
      ) : activeTab === 'per_recipe' ? (
        /* TAB 1: PER RECIPE VIEW */
        <div className="space-y-4">
          {items.map((item) => {
            const recipe = item.recipe
            const multiplier = item.multiplier || 1
            const checkedSet = new Set(item.checked_ingredients || [])
            const baseIngredients = recipe?.ingredients || []
            const scaledIngredients = scaleIngredients(baseIngredients, multiplier)
            const scaledYield = scaleYield(recipe.yield_amount, multiplier, recipe.yield_unit)
            const checkedCount = scaledIngredients.filter((_, idx) =>
              checkedSet.has(String(scaledIngredients[idx]?.id ?? idx))
            ).length
            const isAllChecked = scaledIngredients.length > 0 && checkedCount === scaledIngredients.length
            const isOpen = openRecipeMap[item.recipe_id] ?? !isAllChecked

            return (
              <Collapsible
                key={item.recipe_id}
                open={isOpen}
                onOpenChange={(openState) => {
                  setOpenRecipeMap((prev) => ({ ...prev, [item.recipe_id]: openState }))
                }}
                className={cn(
                  'rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all',
                  isAllChecked && 'opacity-75 border-border/60'
                )}
              >
                {/* Recipe Card Header */}
                <div
                  className={cn(
                    'p-3.5 sm:p-4 bg-muted/30 flex items-center justify-between gap-3 border-b border-border/50 transition-colors',
                    isAllChecked && 'bg-muted/15'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CollapsibleTrigger className="flex items-center gap-3 text-left group cursor-pointer select-none py-0.5">
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0',
                          !isOpen && '-rotate-90'
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={(e) => {
                              if (onViewRecipe) {
                                e.stopPropagation()
                                onViewRecipe(recipe)
                              }
                            }}
                            className={cn(
                              'text-sm sm:text-base font-semibold truncate transition-all',
                              isAllChecked
                                ? 'line-through text-muted-foreground opacity-60'
                                : 'text-foreground',
                              onViewRecipe && 'hover:underline cursor-pointer'
                            )}
                          >
                            {recipe.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-4 font-mono transition-colors',
                              isAllChecked && 'opacity-60'
                            )}
                          >
                            {checkedCount}/{scaledIngredients.length}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {recipe.total_time_minutes > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {recipe.total_time_minutes} min
                            </span>
                          )}
                          {Boolean(recipe.yield_amount) && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {scaledYield || `${recipe.yield_amount} ${recipe.yield_unit || 'servings'}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>

                  {/* Recipe Header Actions: Multiplier & Remove */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMultiplierModalRecipe({ recipeId: item.recipe_id, multiplier })
                      }}
                      className={cn(
                        'cursor-pointer rounded-lg font-mono transition-colors border',
                        multiplier !== 1
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 font-bold shadow-2xs'
                          : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 border-transparent'
                      )}
                      title="Adjust recipe yield multiplier"
                    >
                      <Scale className="h-4 w-4" />
                      <span>{multiplier}×</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveRecipe(item.recipe_id)
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg"
                      title="Remove recipe from shopping list"
                    >
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </Button>
                  </div>
                </div>

                {/* Collapsible Recipe Ingredients List */}
                <CollapsibleContent className="p-2 sm:p-3 pt-1">
                  {scaledIngredients.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3 px-3">
                      No ingredients in this recipe.
                    </p>
                  ) : (
                    scaledIngredients.map((ing, idx) => {
                      const itemKey = String(ing.id ?? idx)
                      const isChecked = checkedSet.has(itemKey)
                      const displayQty = [ing.amount, ing.unit].filter(Boolean).join(' ')

                      return (
                        <div key={itemKey}>
                          {idx > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                          <div
                            onClick={() => handleToggleIngredient(item.recipe_id, itemKey)}
                            className={cn(
                              'flex items-start gap-3.5 py-3.5 sm:py-3 px-3 sm:px-4 rounded-xl cursor-pointer transition-colors select-none hover:bg-muted/40 min-h-[3rem]',
                              isChecked ? 'text-muted-foreground opacity-70' : 'text-foreground'
                            )}
                          >
                            <div
                              className={cn(
                                'mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors border',
                                isChecked
                                  ? 'bg-primary border-primary text-primary-foreground'
                                  : 'border-border bg-card hover:border-primary/50'
                              )}
                            >
                              {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className={cn('text-sm sm:text-[15px] font-medium', isChecked && 'line-through')}>
                                  {ing.name}
                                </span>
                                {displayQty && (
                                  <span
                                    className={cn(
                                      'text-xs sm:text-sm font-mono font-medium shrink-0',
                                      isChecked ? 'text-muted-foreground' : 'text-foreground'
                                    )}
                                  >
                                    {displayQty}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      ) : (
        /* TAB 2: CONSOLIDATED VIEW */
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-2 sm:p-3">
          {consolidated.length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-4 sm:p-5">
              No ingredients to display.
            </p>
          ) : (
            consolidated.map((item, idx) => {
              const isChecked = item.isChecked
              const isPartial = item.isPartial

              return (
                <div key={item.name}>
                  {idx > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                  <div
                    onClick={() => onToggleConsolidatedIngredient(item.name)}
                    className={cn(
                      'flex items-start gap-3.5 py-3.5 sm:py-3 px-3 sm:px-4 rounded-xl cursor-pointer transition-colors select-none hover:bg-muted/40 min-h-[3rem]',
                      isChecked ? 'text-muted-foreground opacity-70' : 'text-foreground'
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-colors border',
                        isChecked || isPartial
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      {isChecked ? (
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      ) : isPartial ? (
                        <Minus className="h-3.5 w-3.5 stroke-[3]" />
                      ) : null}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={cn('text-sm sm:text-[15px] font-medium', isChecked && 'line-through')}>
                          {item.name}
                        </span>
                        {item.displayQuantity && (
                          <span
                            className={cn(
                              'text-xs sm:text-sm font-mono font-medium shrink-0',
                              isChecked ? 'text-muted-foreground' : 'text-foreground'
                            )}
                          >
                            {item.displayQuantity}
                          </span>
                        )}
                      </div>
                      {item.instances.length > 1 && (
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
                          <span className="opacity-80">From:</span>
                          {item.instances.map((inst, idx) => (
                            <span
                              key={`${inst.recipeId}-${inst.itemKey}-${idx}`}
                              className="inline-flex items-center gap-1"
                            >
                              <span
                                className={cn(
                                  inst.isChecked
                                    ? 'line-through opacity-50'
                                    : 'text-foreground/80 font-normal'
                                )}
                              >
                                {inst.recipeTitle}
                                {(inst.amount || inst.unit) && (
                                  <span className="font-mono text-[11px] ml-1 opacity-75">
                                    ({[inst.amount, inst.unit].filter(Boolean).join(' ')})
                                  </span>
                                )}
                              </span>
                              {idx < item.instances.length - 1 && <span className="opacity-40">,</span>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Collapsible History Section (Under Both Views) */}
      <Collapsible
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        className="rounded-2xl border border-border/80 bg-muted/20 overflow-hidden"
      >
        <CollapsibleTrigger className="w-full flex items-center p-4 sm:p-4.5 text-sm sm:text-base font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group select-none gap-3">
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0',
              !historyOpen && '-rotate-90'
            )}
          />
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="h-4.5 w-4.5 shrink-0" />
            <span>Recipe history</span>
            {history.length > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold font-mono">
                {history.length}
              </Badge>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="p-4 pt-0 space-y-3">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No past shopping lists yet. When you clear a list, it is saved here so you can reuse it later.
            </p>
          ) : (
            <div className="space-y-2.5">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-1.5">
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-semibold text-foreground">
                        {h.recipe_titles.length === 0 ? (
                          <span>Saved list</span>
                        ) : (
                          h.recipe_titles.map((title, idx) => {
                            const recipeId = h.recipe_ids?.[idx]
                            return (
                              <span key={`${h.id}-${recipeId ?? idx}-${idx}`} className="inline-flex items-center">
                                {recipeId && (onViewRecipeById || onViewRecipe) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onViewRecipeById && recipeId) {
                                        onViewRecipeById(recipeId)
                                      } else if (onViewRecipe && recipeId) {
                                        const found = items.find((i) => i.recipe_id === recipeId)?.recipe
                                        if (found) onViewRecipe(found)
                                      }
                                    }}
                                    className="hover:underline hover:text-primary transition-colors cursor-pointer text-left font-semibold"
                                    title={`View ${title}`}
                                  >
                                    {title}
                                  </button>
                                ) : (
                                  <span>{title}</span>
                                )}
                                {idx < h.recipe_titles.length - 1 && (
                                  <span className="text-muted-foreground font-normal ml-0.5 mr-1">,</span>
                                )}
                              </span>
                            )
                          })
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                        ({h.ingredient_count} ingredients)
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {formatRelativeDate(h.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadHistory(h.id)}
                      className="h-7 text-xs gap-1.5 cursor-pointer hover:bg-muted"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Load</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteHistory(h.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      title="Delete history item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Yield Multiplier Adjustment Dialog for Shopping List Recipes */}
      <YieldMultiplierDialog
        open={!!multiplierModalRecipe}
        onOpenChange={(open) => {
          if (!open) setMultiplierModalRecipe(null)
        }}
        currentMultiplier={multiplierModalRecipe?.multiplier || 1}
        onApplyMultiplier={(newMultiplier) => {
          if (multiplierModalRecipe && onUpdateRecipeMultiplier) {
            void onUpdateRecipeMultiplier(multiplierModalRecipe.recipeId, newMultiplier)
          }
          setMultiplierModalRecipe(null)
        }}
      />
    </div>
  )
}

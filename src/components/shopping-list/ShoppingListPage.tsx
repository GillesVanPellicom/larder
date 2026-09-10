import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import {
  ArrowRightLeft,
  Check,
  ChevronDown,
  Clock,
  History,
  ListFilter,
  Loader2,
  MoreHorizontal,
  MoveRight,
  Plus,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  Upload,
  Users,
  Utensils,
  X,
} from 'lucide-react'
import { cn } from 'cn'
import type {
  ConsolidatedIngredient,
  Recipe,
  ShoppingListHistoryItem,
  ShoppingListItem,
  ShoppingListTabId,
  TagCategory,
  TimeTrackingMode,
} from '@/shared/types'
import { formatRelativeDate } from '@/lib/dateTime'
import { formatGracefulNumber, scaleIngredients, scaleYield } from '@/lib/recipeMath'
import { YieldMultiplierDialog } from '@/components/recipe-view/YieldMultiplierDialog'
import { RecipeCard } from '@/components/RecipeCard'
import { StoreCombobox } from '@/components/stores/StoreCombobox'
import { IngredientRow } from '@/components/ingredients/IngredientRow'

export interface ShoppingListPageProps {
  items: ShoppingListItem[]
  history: ShoppingListHistoryItem[]
  loading: boolean
  consolidated: ConsolidatedIngredient[]
  uniqueIngredientsCount: number
  storeAssignments?: Record<string, string[]>
  onUpdateStoreAssignments?: (
    assignments:
      | Record<string, string[]>
      | ((prev: Record<string, string[]>) => Record<string, string[]>)
  ) => void
  categories?: TagCategory[]
  timeTrackingMode?: TimeTrackingMode
  activeTab?: ShoppingListTabId
  onTabChange?: (tab: ShoppingListTabId) => void
  isRecipeInShoppingList?: (recipeId: number) => boolean
  onToggleShoppingListRecipe?: (recipeId: number, checkedIngredients?: string[], multiplier?: number) => Promise<void>
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

function renderScaledYield(scaledText: string, isScaled: boolean) {
  if (!isScaled) return scaledText
  const match = scaledText.match(/^([\d.,/]+)(.*)$/)
  if (match) {
    return (
      <>
        <span className="text-amber-600 dark:text-amber-400 font-semibold">{match[1]}</span>
        <span>{match[2]}</span>
      </>
    )
  }
  return <span className="text-amber-600 dark:text-amber-400 font-semibold">{scaledText}</span>
}

function renderItemInstances(item: ConsolidatedIngredient) {
  if (item.instances.length <= 1) return null
  return (
    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
      <span className="opacity-80">From:</span>
      {item.instances.map((inst, instIdx) => (
        <span
          key={`${inst.recipeId}-${inst.itemKey}-${instIdx}`}
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
          {instIdx < item.instances.length - 1 && <span className="opacity-40">,</span>}
        </span>
      ))}
    </div>
  )
}

export function ShoppingListPage({
  items,
  history,
  loading,
  consolidated,
  uniqueIngredientsCount,
  storeAssignments: controlledStoreAssignments,
  onUpdateStoreAssignments,
  categories = [],
  timeTrackingMode = 'prep_and_cook',
  activeTab: controlledActiveTab,
  onTabChange,
  isRecipeInShoppingList,
  onToggleShoppingListRecipe,
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
  const [activeTab, setActiveTab] = useState<ShoppingListTabId>(controlledActiveTab ?? 'per_recipe')
  const [clearing, setClearing] = useState(false)
  const [openRecipeMap, setOpenRecipeMap] = useState<Record<number, boolean>>({})
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null)
  const [multiplierModalRecipe, setMultiplierModalRecipe] = useState<{
    recipeId: number
    multiplier: number
    yieldAmount?: number | string | null
    yieldUnit?: string | null
  } | null>(null)

  // Internal fallback if storeAssignments not controlled
  const [internalStoreAssignments, setInternalStoreAssignments] = useState<Record<string, string[]>>({})
  const storeAssignments = controlledStoreAssignments ?? internalStoreAssignments

  const updateStoreAssignments = useCallback(
    (
      updater:
        | Record<string, string[]>
        | ((prev: Record<string, string[]>) => Record<string, string[]>)
    ) => {
      if (onUpdateStoreAssignments) {
        onUpdateStoreAssignments(updater)
      } else {
        setInternalStoreAssignments((prev) =>
          typeof updater === 'function' ? updater(prev) : updater
        )
      }
    },
    [onUpdateStoreAssignments]
  )

  const [isAssignMode, setIsAssignMode] = useState(false)
  const [activeAssignStore, setActiveAssignStore] = useState('')
  const [openStoreMap, setOpenStoreMap] = useState<Record<string, boolean>>({})
  const [isStoreComboboxShaking, setIsStoreComboboxShaking] = useState(false)
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastShakeTimeRef = useRef<number>(0)

  const triggerStoreComboboxShake = useCallback(() => {
    const now = Date.now()
    // 500ms cooldown to match animation duration and prevent overlapping shakes
    if (now - lastShakeTimeRef.current < 500) {
      return
    }
    lastShakeTimeRef.current = now
    setIsStoreComboboxShaking(true)
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current)
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setIsStoreComboboxShaking(false)
    }, 500)
  }, [])

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current)
      }
    }
  }, [])

  const [moveModalState, setMoveModalState] = useState<{
    open: boolean
    mode: 'store' | 'item'
    fromStore?: string
    itemName?: string
  } | null>(null)
  const [moveDestinationStore, setMoveDestinationStore] = useState('')

  // Compute store grouping for consolidated view
  const { storeNames, storeMap, unassigned, totalAssigned } = useMemo(() => {
    const sMap: Record<string, ConsolidatedIngredient[]> = {}
    const unass: ConsolidatedIngredient[] = []

    for (const item of consolidated) {
      const stack = storeAssignments[item.name.toLowerCase()]
      const assigned = stack && stack.length > 0 ? stack[stack.length - 1] : undefined
      if (assigned) {
        if (!sMap[assigned]) {
          sMap[assigned] = []
        }
        sMap[assigned].push(item)
      } else {
        unass.push(item)
      }
    }

    const names = Object.keys(sMap).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    )

    return {
      storeNames: names,
      storeMap: sMap,
      unassigned: unass,
      totalAssigned: consolidated.length - unass.length,
    }
  }, [consolidated, storeAssignments])

  const handleTapIngredientInAssignMode = (ingredientName: string) => {
    const targetStore = activeAssignStore.trim()
    if (!targetStore) {
      triggerStoreComboboxShake()
      return
    }
    const key = ingredientName.toLowerCase()

    updateStoreAssignments((prev) => {
      const next = { ...prev }
      const currentStack = next[key] || []
      const currentTop = currentStack.length > 0 ? currentStack[currentStack.length - 1] : undefined

      if (currentTop && currentTop.toLowerCase() === targetStore.toLowerCase()) {
        // Unassigning from current active store: pop it off the stack to revert to the previous store!
        const poppedStack = currentStack.slice(0, -1)
        if (poppedStack.length === 0) {
          delete next[key]
        } else {
          next[key] = poppedStack
        }
      } else {
        // Assigning to target store: push target store to the stack
        const filtered = currentStack.filter((s) => s.toLowerCase() !== targetStore.toLowerCase())
        next[key] = [...filtered, targetStore]
      }
      return next
    })
  }

  const handleMassRemoveFromStore = (storeName: string) => {
    const sNameLower = storeName.toLowerCase()
    updateStoreAssignments((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        const stack = next[k] || []
        const filtered = stack.filter((s) => s.toLowerCase() !== sNameLower)
        if (filtered.length === 0) {
          delete next[k]
        } else {
          next[k] = filtered
        }
      }
      return next
    })
  }

  const handleMassMoveStore = (fromStoreName: string, toStoreName: string) => {
    if (!toStoreName.trim()) return
    const fromLower = fromStoreName.toLowerCase()
    const toName = toStoreName.trim()
    updateStoreAssignments((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) {
        const stack = next[k] || []
        if (stack.length > 0 && stack[stack.length - 1].toLowerCase() === fromLower) {
          const filtered = stack.filter((s) => s.toLowerCase() !== toName.toLowerCase())
          next[k] = [...filtered.filter((s) => s.toLowerCase() !== fromLower), toName]
        }
      }
      return next
    })
  }

  const handleMoveSingleItem = (ingredientName: string, toStoreName: string) => {
    if (!toStoreName.trim()) return
    const key = ingredientName.toLowerCase()
    const toName = toStoreName.trim()
    updateStoreAssignments((prev) => {
      const next = { ...prev }
      const currentStack = next[key] || []
      const filtered = currentStack.filter((s) => s.toLowerCase() !== toName.toLowerCase())
      next[key] = [...filtered, toName]
      return next
    })
  }

  const handleUnassignSingleItem = (ingredientName: string) => {
    const key = ingredientName.toLowerCase()
    updateStoreAssignments((prev) => {
      const next = { ...prev }
      const currentStack = next[key] || []
      if (currentStack.length <= 1) {
        delete next[key]
      } else {
        next[key] = currentStack.slice(0, -1)
      }
      return next
    })
  }

  const handleClearAllAssignments = () => {
    updateStoreAssignments(() => ({}))
  }

  useEffect(() => {
    if (controlledActiveTab) {
      setActiveTab((prev) => (controlledActiveTab !== prev ? controlledActiveTab : prev))
    }
  }, [controlledActiveTab])

  const handleTabChange = (newTab: ShoppingListTabId) => {
    if (newTab === activeTab) return
    setActiveTab(newTab)
    onTabChange?.(newTab)
  }

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

  const handleToggleConsolidatedIngredient = (ingredientName: string) => {
    const normName = ingredientName.toLowerCase()
    const targetGroup = consolidated.find((c) => c.name.toLowerCase() === normName)
    if (targetGroup) {
      const willBeChecked = !targetGroup.isChecked
      if (willBeChecked) {
        const stack = storeAssignments[normName] || []
        const assignedStore = stack.length > 0 ? stack[stack.length - 1] : undefined
        const storeKey = assignedStore || '__unassigned'
        const storeItems = assignedStore ? storeMap[assignedStore] || [] : unassigned

        // If every other item in this store is already checked, auto-collapse this store
        const willAllStoreItemsBeChecked = storeItems.every((item) =>
          item.name.toLowerCase() === normName || item.isChecked
        )
        if (willAllStoreItemsBeChecked) {
          setOpenStoreMap((prev) => ({ ...prev, [storeKey]: false }))
        }
      }
    }
    void onToggleConsolidatedIngredient(ingredientName)
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
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-light tracking-wide text-foreground">
            Shopping List
          </h1>
          <InfoTooltip content="Organize grocery ingredients by recipe or as a consolidated checklist. Changes are shared and synced in real-time." />
        </div>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-light">
          {items.length > 0
            ? `${items.length} recipe${items.length > 1 ? 's' : ''} • ${uniqueIngredientsCount} ingredient${uniqueIngredientsCount !== 1 ? 's' : ''}`
            : 'Add recipes to build your grocery checklist.'}
        </p>
      </div>

      {/* Primary Tabs (Left-aligned views + Right-aligned history tab) */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            type="button"
            onClick={() => handleTabChange('per_recipe')}
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
            onClick={() => handleTabChange('consolidated')}
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

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={cn(
            'group relative flex items-center gap-2 px-2 sm:px-3 pb-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer',
            activeTab === 'history'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <History className="h-4 w-4" />
          <span>History</span>
        </button>
      </div>

      {/* Main View Area */}
      {activeTab === 'history' ? (
        /* TAB 3: HISTORY VIEW */
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-2 sm:p-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-4 py-16">
              <div className="mb-4 text-muted-foreground/40">
                <History className="h-12 w-12 stroke-[1.5]" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                No past lists yet
              </h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm font-light">
                When you clear a shopping list, it will be automatically saved here so you can reuse it later.
              </p>
            </div>
          ) : (
            history.slice(0, 10).map((h, idx) => {
              const isOpen = openHistoryId === h.id
              const headerTitles =
                h.recipe_titles.length === 0
                  ? 'Saved list'
                  : h.recipe_titles
                      .map((title, tIdx) => {
                        const recipeId = h.recipe_ids?.[tIdx]
                        const mult =
                          recipeId && h.recipe_multipliers
                            ? h.recipe_multipliers[String(recipeId)] ?? h.recipe_multipliers[recipeId]
                            : undefined
                        if (mult && Math.abs(mult - 1) > 0.001) {
                          return `${title} (${formatGracefulNumber(mult)}×)`
                        }
                        return title
                      })
                      .join(', ')

              return (
                <Collapsible
                  key={h.id}
                  open={isOpen}
                  onOpenChange={(openState) => {
                    setOpenHistoryId(openState ? h.id : null)
                  }}
                >
                  {idx > 0 && <div className="border-t border-border mx-3 sm:mx-4 my-0.5" />}
                  <div className="py-0.5 px-0.5">
                    <CollapsibleTrigger className="flex items-center gap-3 text-left group cursor-pointer select-none py-3.5 sm:py-3 px-3 sm:px-4 rounded-xl transition-colors hover:bg-muted/40 w-full min-h-[3.25rem]">
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 shrink-0',
                          !isOpen && '-rotate-90'
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div
                            className="text-sm sm:text-[15px] font-medium text-foreground truncate"
                            title={headerTitles}
                          >
                            {headerTitles}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 truncate">
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatRelativeDate(h.created_at)}
                          </span>
                          <span className="inline-flex items-center gap-1 truncate">
                            <ShoppingBag className="h-3 w-3 shrink-0" />
                            <span>{h.ingredient_count} ingredient{h.ingredient_count !== 1 ? 's' : ''}</span>
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    {/* Expanded Content: Recipe Cards Grid + Action Buttons (shown only when opened) */}
                    <CollapsibleContent className="px-3 sm:px-4 pb-3 pt-0.5">
                      <div className="pt-3 border-t border-border space-y-4">
                        {/* Recipe Cards Grid */}
                        {h.recipes && h.recipes.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {h.recipes.map((recipe) => {
                              const multiplier =
                                h.recipe_multipliers?.[String(recipe.id)] ??
                                h.recipe_multipliers?.[recipe.id] ??
                                1
                              const inActiveList = isRecipeInShoppingList
                                ? isRecipeInShoppingList(recipe.id)
                                : items.some((i) => i.recipe_id === recipe.id)

                              return (
                                <RecipeCard
                                  key={recipe.id}
                                  recipe={recipe}
                                  categories={categories}
                                  timeTrackingMode={timeTrackingMode}
                                  multiplier={multiplier}
                                  isInShoppingList={inActiveList}
                                  onToggleShoppingList={() => {
                                    if (onToggleShoppingListRecipe) {
                                      void onToggleShoppingListRecipe(recipe.id, undefined, multiplier)
                                    } else if (inActiveList) {
                                      void onRemoveRecipe(recipe.id)
                                    }
                                  }}
                                  onView={(r) => {
                                    if (onViewRecipe) {
                                      onViewRecipe(r)
                                    } else if (onViewRecipeById) {
                                      onViewRecipeById(r.id)
                                    }
                                  }}
                                />
                              )
                            })}
                          </div>
                        ) : h.recipe_titles.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No recipes in this snapshot.</p>
                        ) : (
                          /* Fallback if recipe records are not available */
                          <div className="space-y-2">
                            {h.recipe_titles.map((title, tIdx) => {
                              const recipeId = h.recipe_ids?.[tIdx]
                              const mult =
                                recipeId && h.recipe_multipliers
                                  ? h.recipe_multipliers[String(recipeId)] ?? h.recipe_multipliers[recipeId]
                                  : undefined
                              return (
                                <div
                                  key={`${h.id}-${recipeId ?? tIdx}-${tIdx}`}
                                  className="flex items-center justify-between text-sm text-foreground py-1"
                                >
                                  <span className="font-medium">{title}</span>
                                  {mult && Math.abs(mult - 1) > 0.001 && (
                                    <Badge
                                      variant="secondary"
                                      className="font-mono text-xs text-amber-600 dark:text-amber-400"
                                    >
                                      {formatGracefulNumber(mult)}×
                                    </Badge>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Actions: Delete (left) and Load (right) */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteHistory(h.id)
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl shrink-0"
                            title="Delete history entry"
                            aria-label="Delete history entry"
                          >
                            <Trash2 className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation()
                              onLoadHistory(h.id)
                              handleTabChange('per_recipe')
                            }}
                            className="cursor-pointer rounded-xl text-sm font-medium gap-2 shrink-0"
                            title="Load recipes into shopping list"
                          >
                            <Upload className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                            <span>Load</span>
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })
          )}
        </div>
      ) : loading && isEmpty ? (
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
            const isScaled = Math.abs(multiplier - 1) > 0.001
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
                    'relative overflow-hidden p-3.5 sm:p-4 bg-muted/30 flex flex-row items-center justify-between gap-2.5 sm:gap-3 border-b border-border/50 transition-colors',
                    isAllChecked && 'bg-muted/15'
                  )}
                >
                  {/* Background Recipe Image (1/2 width on left behind text with light blur fading to transparent) */}
                  {recipe.image_url && (
                    <div className="absolute inset-y-0 left-0 w-1/2 pointer-events-none overflow-hidden select-none [mask-image:linear-gradient(to_right,black_20%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,black_20%,transparent_100%)]">
                      <img
                        src={recipe.image_url}
                        alt=""
                        aria-hidden="true"
                        className="h-full w-full object-cover blur-[2px] scale-110 opacity-30 dark:opacity-35"
                      />
                    </div>
                  )}

                  {/* Left: Chevron, Multiplier & Title/Metadata */}
                  <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    {/* Chevron Toggle Trigger */}
                    <CollapsibleTrigger className="flex items-center text-left group cursor-pointer select-none py-1 shrink-0">
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 shrink-0',
                          !isOpen && '-rotate-90'
                        )}
                      />
                    </CollapsibleTrigger>

                    {/* Multiplier Button (placed on left) */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMultiplierModalRecipe({
                          recipeId: item.recipe_id,
                          multiplier,
                          yieldAmount: recipe.yield_amount,
                          yieldUnit: recipe.yield_unit,
                        })
                      }}
                      className={cn(
                        'cursor-pointer rounded-xl font-mono transition-colors border px-2.5 sm:px-3 h-8 sm:h-9 text-xs sm:text-sm font-medium shrink-0',
                        Math.abs(multiplier - 1) > 0.001
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25 font-bold shadow-2xs'
                          : 'text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 border-transparent bg-background/50 backdrop-blur-xs'
                      )}
                      title="Adjust recipe yield multiplier"
                    >
                      <span>{formatGracefulNumber(multiplier)}×</span>
                    </Button>

                    {/* Title & Metadata (also acts as collapsible trigger) */}
                    <CollapsibleTrigger className="flex items-center text-left group cursor-pointer select-none min-w-0 flex-1 py-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3
                            onClick={(e) => {
                              if (onViewRecipe) {
                                e.stopPropagation()
                                onViewRecipe(recipe)
                              }
                            }}
                            title={recipe.title}
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
                              'text-xs px-2.5 py-0.5 h-5.5 font-mono font-medium transition-colors shrink-0 bg-background/60 backdrop-blur-xs',
                              isAllChecked && 'opacity-60'
                            )}
                          >
                            {checkedCount}/{scaledIngredients.length}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 truncate">
                          {recipe.total_time_minutes > 0 && (
                            <span className="inline-flex items-center gap-1 shrink-0">
                              <Clock className="h-3 w-3" />
                              {recipe.total_time_minutes} min
                            </span>
                          )}
                          {Boolean(recipe.yield_amount) && (
                            <span className="inline-flex items-center gap-1 min-w-0 truncate">
                              <Users className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {renderScaledYield(
                                  scaledYield || `${recipe.yield_amount} ${recipe.yield_unit || 'servings'}`,
                                  isScaled
                                )}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                  </div>

                  {/* Right: Remove Button */}
                  <div className="relative z-10 flex items-center shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveRecipe(item.recipe_id)
                      }}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl shrink-0"
                      title="Remove recipe from shopping list"
                      aria-label="Remove recipe from shopping list"
                    >
                      <X className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
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
                          <IngredientRow
                            name={ing.name}
                            quantity={displayQty || undefined}
                            isChecked={isChecked}
                            onClick={() => handleToggleIngredient(item.recipe_id, itemKey)}
                          />
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
        <div className="space-y-4">
          {/* Top Controls Toolbar for Consolidated View */}
          {consolidated.length > 0 && !isAssignMode && (
            <div className="flex items-center justify-end p-1">
              {/* Assign Mode Trigger */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignMode(true)}
                className="gap-1.5 cursor-pointer rounded-xl text-xs h-8.5 font-medium"
                title="Enter mode to quickly assign ingredients to stores"
              >
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Assign stores</span>
                {totalAssigned > 0 && (
                  <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 h-4.5">
                    {totalAssigned}/{consolidated.length}
                  </Badge>
                )}
              </Button>
            </div>
          )}

          {/* ASSIGNMENT MODE ACTIVE BANNER / TOOLBAR */}
          {isAssignMode && (
            <div className="sticky top-[88px] sm:top-[108px] z-30 rounded-2xl border-2 border-primary/40 bg-card/95 backdrop-blur-md p-3.5 sm:p-4 shadow-md space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">Store Assignment Mode</span>
                  <InfoTooltip content="Select a store and tap ingredients to assign them. Tapping an item already assigned to this store will unassign it." />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {totalAssigned > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllAssignments}
                      className="text-xs text-muted-foreground hover:text-destructive cursor-pointer h-8"
                    >
                      Clear all
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setIsAssignMode(false)
                    }}
                    className="cursor-pointer gap-1.5 font-medium h-8 px-4"
                  >
                    <Check className="h-4 w-4" />
                    <span>Done</span>
                  </Button>
                </div>
              </div>

              {/* Store Selector & Progress */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-border/60">
                <div className="flex-1 max-w-sm">
                  <StoreCombobox
                    value={activeAssignStore}
                    onChange={setActiveAssignStore}
                    placeholder="Select store to assign..."
                    className={cn(isStoreComboboxShaking && 'animate-head-shake')}
                  />
                </div>

                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {totalAssigned} of {consolidated.length} assigned
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* MAIN CONSOLIDATED CONTENT */}
          {consolidated.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-4 sm:p-5">
              <p className="text-xs text-muted-foreground italic">
                No ingredients to display.
              </p>
            </div>
          ) : isAssignMode ? (
            /* ASSIGNMENT MODE: TAP-TO-ASSIGN LIST */
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-2 sm:p-3 space-y-1">
              {consolidated.map((item, idx) => {
                const stack = storeAssignments[item.name.toLowerCase()] || []
                const assignedStore = stack.length > 0 ? stack[stack.length - 1] : undefined
                const isTargetStore =
                  activeAssignStore &&
                  assignedStore &&
                  assignedStore.toLowerCase() === activeAssignStore.trim().toLowerCase()
                const isOtherStore = assignedStore && !isTargetStore

                return (
                  <div key={item.name}>
                    {idx > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                    <IngredientRow
                      name={
                        <span
                          className={cn(
                            isTargetStore
                              ? 'font-semibold text-primary dark:text-primary'
                              : isOtherStore
                                ? 'text-muted-foreground font-normal'
                                : 'font-medium text-foreground'
                          )}
                        >
                          {item.name}
                        </span>
                      }
                      quantity={item.displayQuantity || undefined}
                      onClick={() => handleTapIngredientInAssignMode(item.name)}
                      dimmed={Boolean(isOtherStore)}
                      className={cn(
                        isTargetStore && 'bg-primary/10 border border-primary/40 shadow-2xs font-semibold'
                      )}
                      leading={
                        <div className="shrink-0">
                          {isTargetStore ? (
                            <Badge className="bg-primary text-primary-foreground text-xs font-semibold gap-1 py-1">
                              <Check className="h-3 w-3" />
                              <span>{assignedStore}</span>
                            </Badge>
                          ) : assignedStore ? (
                            <Badge
                              variant="secondary"
                              className="text-xs font-medium gap-1 text-muted-foreground py-1 bg-muted/60"
                            >
                              <Store className="h-3 w-3 opacity-60" />
                              <span>{assignedStore}</span>
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground/70 border-dashed gap-1 py-1 hover:border-primary/50 hover:text-primary"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Assign</span>
                            </Badge>
                          )}
                        </div>
                      }
                    />
                  </div>
                )
              })}
            </div>
          ) : storeNames.length > 0 ? (
            /* GROUPED BY STORE: ACCORDIONS PER STORE + UNASSIGNED */
            <div className="space-y-4">
              {/* Store Accordions */}
              {storeNames.map((sName) => {
                const storeItems = storeMap[sName] || []
                const checkedCount = storeItems.filter((i) => i.isChecked).length
                const isAllChecked = storeItems.length > 0 && checkedCount === storeItems.length
                const isOpen = openStoreMap[sName] ?? !isAllChecked

                return (
                  <Collapsible
                    key={sName}
                    open={isOpen}
                    onOpenChange={(openState) => {
                      setOpenStoreMap((prev) => ({ ...prev, [sName]: openState }))
                    }}
                    className={cn(
                      'rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all',
                      isAllChecked && 'opacity-75 border-border/60'
                    )}
                  >
                    {/* Store Accordion Header */}
                    <div
                      className={cn(
                        'p-3 sm:p-3.5 bg-muted/30 flex items-center justify-between gap-3 border-b border-border/50 transition-colors',
                        isAllChecked && 'bg-muted/15'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CollapsibleTrigger className="flex items-center text-left group cursor-pointer select-none py-1 shrink-0">
                          <ChevronDown
                            className={cn(
                              'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 shrink-0',
                              !isOpen && '-rotate-90'
                            )}
                          />
                        </CollapsibleTrigger>

                        <CollapsibleTrigger className="flex items-center gap-2 text-left group cursor-pointer select-none min-w-0 flex-1 py-1">
                          <Store className="h-4 w-4 text-primary shrink-0" />
                          <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                            {sName}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs px-2 py-0.5 h-5 font-medium shrink-0 bg-background/60"
                          >
                            {checkedCount}/{storeItems.length}
                          </Badge>
                        </CollapsibleTrigger>
                      </div>

                      {/* Store Options Dropdown Menu */}
                      <div className="flex items-center gap-1 shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-lg"
                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                title="Store options"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setMoveDestinationStore('')
                                setMoveModalState({ open: true, mode: 'store', fromStore: sName })
                              }}
                              className="cursor-pointer gap-2"
                            >
                              <MoveRight className="h-3.5 w-3.5" />
                              <span>Move all items...</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleMassRemoveFromStore(sName)}
                              className="cursor-pointer gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove from store</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Store Items List */}
                    <CollapsibleContent className="p-2 sm:p-3 pt-1">
                      {storeItems.map((item, idx) => {
                        const isChecked = item.isChecked
                        const isPartial = item.isPartial

                        return (
                          <div key={item.name}>
                            {idx > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                            <IngredientRow
                              name={item.name}
                              quantity={item.displayQuantity || undefined}
                              isChecked={isChecked}
                              isPartial={isPartial}
                              onClick={() => handleToggleConsolidatedIngredient(item.name)}
                              actions={
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon-lg"
                                        onClick={(e) => e.stopPropagation()}
                                        className="cursor-pointer text-muted-foreground/60 hover:text-foreground -mr-2"
                                        title="Item options"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setMoveDestinationStore('')
                                        setMoveModalState({
                                          open: true,
                                          mode: 'item',
                                          itemName: item.name,
                                        })
                                      }}
                                      className="cursor-pointer gap-2 text-xs"
                                    >
                                      <MoveRight className="h-3 w-3" />
                                      <span>Move to store...</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleUnassignSingleItem(item.name)
                                      }}
                                      className="cursor-pointer gap-2 text-xs"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Remove from store</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              }
                              secondary={renderItemInstances(item)}
                            />
                          </div>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}

              {/* Unassigned Accordion (if any items remain unassigned) */}
              {unassigned.length > 0 && (() => {
                const isUnassignedAllChecked = unassigned.every((i) => i.isChecked)
                const isUnassignedOpen = openStoreMap['__unassigned'] ?? !isUnassignedAllChecked

                return (
                  <Collapsible
                    open={isUnassignedOpen}
                    onOpenChange={(openState) => {
                      setOpenStoreMap((prev) => ({ ...prev, __unassigned: openState }))
                    }}
                    className={cn(
                      'rounded-2xl border border-border bg-card shadow-xs overflow-hidden transition-all',
                      isUnassignedAllChecked && 'opacity-75 border-border/60'
                    )}
                  >
                    <div
                      className={cn(
                        'p-3 sm:p-3.5 bg-muted/20 flex items-center justify-between gap-3 border-b border-border/50 transition-colors',
                        isUnassignedAllChecked && 'bg-muted/10'
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <CollapsibleTrigger className="flex items-center text-left group cursor-pointer select-none py-1 shrink-0">
                          <ChevronDown
                            className={cn(
                              'h-5 w-5 text-muted-foreground group-hover:text-foreground transition-transform duration-300 shrink-0',
                              !isUnassignedOpen && '-rotate-90'
                            )}
                          />
                        </CollapsibleTrigger>

                        <CollapsibleTrigger className="flex items-center gap-2 text-left group cursor-pointer select-none min-w-0 flex-1 py-1">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h3 className="text-sm sm:text-base font-medium text-muted-foreground truncate">
                            Other / Unassigned
                          </h3>
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs px-2 py-0.5 h-5 font-medium shrink-0 bg-background/60"
                          >
                            {unassigned.filter((i) => i.isChecked).length}/{unassigned.length}
                          </Badge>
                        </CollapsibleTrigger>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAssignMode(true)}
                        className="cursor-pointer text-xs gap-1 text-primary hover:bg-primary/10 h-7"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Assign</span>
                      </Button>
                    </div>

                    <CollapsibleContent className="p-2 sm:p-3 pt-1">
                      {unassigned.map((item, idx) => {
                        const isChecked = item.isChecked
                        const isPartial = item.isPartial

                        return (
                          <div key={item.name}>
                            {idx > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                            <IngredientRow
                              name={item.name}
                              quantity={item.displayQuantity || undefined}
                              isChecked={isChecked}
                              isPartial={isPartial}
                              onClick={() => handleToggleConsolidatedIngredient(item.name)}
                              actions={
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon-lg"
                                        onClick={(e) => e.stopPropagation()}
                                        className="cursor-pointer text-muted-foreground/60 hover:text-foreground -mr-2"
                                        title="Item options"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setMoveDestinationStore('')
                                        setMoveModalState({
                                          open: true,
                                          mode: 'item',
                                          itemName: item.name,
                                        })
                                      }}
                                      className="cursor-pointer gap-2 text-xs"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Assign to store...</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              }
                              secondary={renderItemInstances(item)}
                            />
                          </div>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })()}
            </div>
          ) : (
            /* FLAT LIST (ALL ITEMS) VIEW */
            <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden p-2 sm:p-3">
              {consolidated.map((item, idx) => {
                const isChecked = item.isChecked
                const isPartial = item.isPartial
                const stack = storeAssignments[item.name.toLowerCase()] || []
                const assignedStore = stack.length > 0 ? stack[stack.length - 1] : undefined

                return (
                  <div key={item.name}>
                    {idx > 0 && <div className="border-t border-border/40 mx-3 sm:mx-4 my-0.5" />}
                    <IngredientRow
                      name={item.name}
                      quantity={item.displayQuantity || undefined}
                      isChecked={isChecked}
                      isPartial={isPartial}
                      onClick={() => handleToggleConsolidatedIngredient(item.name)}
                      badge={
                        assignedStore ? (
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-normal py-0 px-1.5 h-4.5 text-muted-foreground shrink-0 gap-1"
                          >
                            <Store className="h-2.5 w-2.5 opacity-60" />
                            <span>{assignedStore}</span>
                          </Badge>
                        ) : undefined
                      }
                      secondary={renderItemInstances(item)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom Action: Clear */}
      {!isEmpty && activeTab !== 'history' && (
        <div className="flex items-center justify-center pt-6">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleClear}
            disabled={clearing}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            title="Clear all recipes from the shopping list"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        </div>
      )}

      {/* Yield Multiplier Adjustment Dialog for Shopping List Recipes */}
      <YieldMultiplierDialog
        open={!!multiplierModalRecipe}
        onOpenChange={(open) => {
          if (!open) setMultiplierModalRecipe(null)
        }}
        currentMultiplier={multiplierModalRecipe?.multiplier || 1}
        baseYieldAmount={multiplierModalRecipe?.yieldAmount}
        yieldUnit={multiplierModalRecipe?.yieldUnit}
        onApplyMultiplier={(newMultiplier) => {
          if (multiplierModalRecipe && onUpdateRecipeMultiplier) {
            void onUpdateRecipeMultiplier(multiplierModalRecipe.recipeId, newMultiplier)
          }
          setMultiplierModalRecipe(null)
        }}
      />

      {/* Move Store Modal / Dialog */}
      <Dialog
        open={!!moveModalState}
        onOpenChange={(open) => {
          if (!open) {
            setMoveModalState(null)
            setMoveDestinationStore('')
          }
        }}
      >
        <DialogContent className="max-w-md bg-card/85 backdrop-blur-md border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              {moveModalState?.mode === 'store'
                ? `Move items from ${moveModalState.fromStore}`
                : `Move "${moveModalState?.itemName}"`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the destination store to move{' '}
              {moveModalState?.mode === 'store' ? 'all items' : 'this ingredient'} to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Destination store</label>
              <StoreCombobox
                value={moveDestinationStore}
                onChange={setMoveDestinationStore}
                placeholder="Select or create destination store..."
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2 gap-2 flex-row justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setMoveModalState(null)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => {
                  if (moveModalState?.mode === 'store' && moveModalState.fromStore) {
                    handleMassMoveStore(moveModalState.fromStore, moveDestinationStore)
                  } else if (moveModalState?.mode === 'item' && moveModalState.itemName) {
                    handleMoveSingleItem(moveModalState.itemName, moveDestinationStore)
                  }
                  setMoveModalState(null)
                  setMoveDestinationStore('')
                }}
                disabled={!moveDestinationStore.trim()}
                className="cursor-pointer"
              >
                Move
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

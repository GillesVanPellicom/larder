import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, ExternalLink, MoreHorizontal, Pencil, RotateCcw, Scale, ShoppingBag, Trash2 } from 'lucide-react'
import { RecipeHero } from './RecipeHero'
import { RecipeIngredientsList } from './RecipeIngredientsList'
import { RecipeInstructionsView } from './RecipeInstructionsView'
import { YieldMultiplierDialog } from './YieldMultiplierDialog'
import { scaleIngredients, scaleYield } from '@/lib/recipeMath'
import type { Recipe, TagCategory, TimeTrackingMode } from '@/shared/types'

export interface RecipeViewPageProps {
  recipe: Recipe
  categories: TagCategory[]
  timeTrackingMode?: TimeTrackingMode
  onTagClick?: (catId: string, tag: string) => void
  onBack: () => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
  isInShoppingList?: boolean
  initialYieldMultiplier?: number
  onUpdateShoppingListMultiplier?: (recipeId: number, multiplier: number) => void
  onToggleShoppingList?: (recipe: Recipe, checkedIngredients?: string[], multiplier?: number) => void
  hideTopBar?: boolean
}

function renderFormattedSource(text: string) {
  if (!text) return null
  // Split on URLs (http/https or www.)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi
  const parts = text.split(urlRegex)

  return (
    <span>
      {parts.map((part, index) => {
        if (/^(https?:\/\/|www\.)/i.test(part)) {
          const href = part.startsWith('http') ? part : `https://${part}`
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline inline-flex items-center gap-0.5 hover:opacity-80 break-all font-medium"
            >
              <span>{part}</span>
              <ExternalLink className="h-3 w-3 inline shrink-0 ml-0.5" />
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

export function RecipeViewPage({
  recipe,
  categories,
  timeTrackingMode = 'prep_and_cook',
  onTagClick,
  onBack,
  onEdit,
  onDeleteRequest,
  isInShoppingList = false,
  initialYieldMultiplier = 1,
  onUpdateShoppingListMultiplier,
  onToggleShoppingList,
  hideTopBar = false,
}: RecipeViewPageProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})
  const [yieldMultiplier, setYieldMultiplier] = useState(initialYieldMultiplier || 1)
  const [yieldModalOpen, setYieldModalOpen] = useState(false)

  const displayIngredients = useMemo(
    () => scaleIngredients(recipe.ingredients || [], yieldMultiplier),
    [recipe.ingredients, yieldMultiplier]
  )

  const scaledYield = useMemo(
    () => scaleYield(recipe.yield_amount, yieldMultiplier, recipe.yield_unit),
    [recipe.yield_amount, recipe.yield_unit, yieldMultiplier]
  )

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleApplyYieldMultiplier = (mult: number) => {
    setYieldMultiplier(mult)
    if (isInShoppingList && onUpdateShoppingListMultiplier) {
      onUpdateShoppingListMultiplier(recipe.id, mult)
    }
  }

  const handleToggleShoppingList = () => {
    const tickedKeys = Object.entries(checkedIngredients)
      .filter(([, checked]) => checked)
      .map(([key]) => key)
    onToggleShoppingList?.(recipe, tickedKeys, yieldMultiplier)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      {!hideTopBar && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            title="Back"
            className="cursor-pointer border-border hover:bg-muted text-foreground"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer border-border hover:bg-muted text-foreground"
                  title="Recipe options"
                >
                  <MoreHorizontal className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-md">
              {onToggleShoppingList && (
                <DropdownMenuItem
                  onClick={handleToggleShoppingList}
                  className="cursor-pointer gap-2 py-2 text-xs font-medium text-foreground"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{isInShoppingList ? 'Remove from shopping list' : 'Add to shopping list'}</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => setYieldModalOpen(true)}
                className="cursor-pointer gap-2 py-2 text-xs font-medium text-foreground"
              >
                <Scale className="h-4 w-4" />
                <span>Yield multiplier</span>
              </DropdownMenuItem>

              {yieldMultiplier !== 1 && (
                <DropdownMenuItem
                  onClick={() => setYieldMultiplier(1)}
                  className="cursor-pointer gap-2 text-xs py-1.5 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset to 1×</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onEdit(recipe)}
                className="cursor-pointer gap-2 py-2 text-xs font-medium text-foreground"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => onDeleteRequest(recipe)}
                className="cursor-pointer gap-2 py-2 text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Hero Media, Metrics & Integrated Tags */}
      <RecipeHero
        recipe={recipe}
        categories={categories}
        scaledYield={scaledYield}
        yieldMultiplier={yieldMultiplier}
        timeTrackingMode={timeTrackingMode}
        onTagClick={onTagClick}
        onOpenYieldModal={() => setYieldModalOpen(true)}
      />

      {/* Two Column Layout: Ingredients & Method (stacked on mobile & portrait tablet, side-by-side on desktop/landscape) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredients Column */}
        <div className="lg:col-span-1">
          <RecipeIngredientsList
            ingredients={displayIngredients}
            checkedIngredients={checkedIngredients}
            onToggleIngredient={toggleIngredient}
            yieldMultiplier={yieldMultiplier}
            onResetYield={() => handleApplyYieldMultiplier(1)}
            isInShoppingList={isInShoppingList}
            onToggleShoppingList={onToggleShoppingList ? handleToggleShoppingList : undefined}
          />
        </div>

        {/* Instructions Column */}
        <div className="lg:col-span-2 space-y-6">
          <RecipeInstructionsView instructions={recipe.instructions} />

          {/* Originally Adapted From */}
          {recipe.source_url && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1">
              <span className="font-semibold shrink-0 text-foreground/80">Originally adapted from:</span>
              <span className="text-foreground/90">
                {renderFormattedSource(recipe.source_url)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Volatile Yield Multiplier Dialog */}
      <YieldMultiplierDialog
        open={yieldModalOpen}
        onOpenChange={setYieldModalOpen}
        currentMultiplier={yieldMultiplier}
        onApplyMultiplier={handleApplyYieldMultiplier}
        baseYieldAmount={recipe.yield_amount}
        yieldUnit={recipe.yield_unit}
      />
    </div>
  )
}

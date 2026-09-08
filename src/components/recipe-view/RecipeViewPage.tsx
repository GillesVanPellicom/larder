import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AddToTodoDialog } from '@/components/AddToTodoDialog'
import { ArrowLeft, ExternalLink, ListTodo, MoreHorizontal, Pencil, RotateCcw, Scale, Trash2 } from 'lucide-react'
import { RecipeHero } from './RecipeHero'
import { RecipeIngredientsList } from './RecipeIngredientsList'
import { RecipeInstructionsView } from './RecipeInstructionsView'
import { YieldMultiplierDialog } from './YieldMultiplierDialog'
import { scaleIngredients, scaleYield } from '@/lib/recipeMath'
import type { Recipe, RecipeTemplate, TagCategory, TimeTrackingMode } from '@/shared/types'

export interface RecipeViewPageProps {
  recipe: Recipe
  categories: TagCategory[]
  template?: RecipeTemplate | null
  timeTrackingMode?: TimeTrackingMode
  onTagClick?: (catId: string, tag: string) => void
  onBack: () => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
  hideTopBar?: boolean
}

export function RecipeViewPage({
  recipe,
  categories,
  timeTrackingMode = 'prep_and_cook',
  onTagClick,
  onBack,
  onEdit,
  onDeleteRequest,
  hideTopBar = false,
}: RecipeViewPageProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})
  const [todoDialogOpen, setTodoDialogOpen] = useState(false)
  const [yieldMultiplier, setYieldMultiplier] = useState(1)
  const [yieldModalOpen, setYieldModalOpen] = useState(false)

  const displayIngredients = useMemo(
    () => scaleIngredients(recipe.ingredients || [], yieldMultiplier),
    [recipe.ingredients, yieldMultiplier]
  )

  const scaledYield = useMemo(
    () => scaleYield(recipe.yield_amount, yieldMultiplier),
    [recipe.yield_amount, yieldMultiplier]
  )

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }))
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

              <DropdownMenuItem
                onClick={() => setTodoDialogOpen(true)}
                disabled={displayIngredients.length === 0}
                className="cursor-pointer gap-2 py-2 text-xs font-medium text-foreground"
              >
                <ListTodo className="h-4 w-4" />
                <span>Export to Microsoft To Do</span>
              </DropdownMenuItem>

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
      />

      {/* Two Column Layout: Ingredients & Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingredients Column */}
        <div className="md:col-span-1">
          <RecipeIngredientsList
            ingredients={displayIngredients}
            checkedIngredients={checkedIngredients}
            onToggleIngredient={toggleIngredient}
            yieldMultiplier={yieldMultiplier}
            onOpenYieldModal={() => setYieldModalOpen(true)}
          />
        </div>

        {/* Instructions & Notes Column */}
        <div className="md:col-span-2 space-y-6">
          <RecipeInstructionsView instructions={recipe.instructions} />

          {/* Notes Block */}
          {recipe.notes && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/15 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                Cook&apos;s Notes
              </h3>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {recipe.notes}
              </p>
            </div>
          )}

          {/* Source Link */}
          {recipe.source_url && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Originally adapted from:</span>
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline flex items-center gap-1 hover:opacity-80 truncate max-w-sm"
              >
                <span>{recipe.source_url}</span>
                <ExternalLink className="h-3 w-3 inline shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Microsoft To Do Integration Dialog */}
      <AddToTodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        recipeTitle={recipe.title}
        ingredients={displayIngredients}
        checkedIngredients={checkedIngredients}
      />

      {/* Volatile Yield Multiplier Dialog */}
      <YieldMultiplierDialog
        open={yieldModalOpen}
        onOpenChange={setYieldModalOpen}
        currentMultiplier={yieldMultiplier}
        onApplyMultiplier={setYieldMultiplier}
      />
    </div>
  )
}

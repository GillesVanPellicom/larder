import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { AddToTodoDialog } from '@/components/AddToTodoDialog'
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { RecipeHero } from './RecipeHero'
import { RecipeIngredientsList } from './RecipeIngredientsList'
import { RecipeInstructionsView } from './RecipeInstructionsView'
import { RecipeFieldsView } from '@/components/template-engine/RecipeFieldsView'
import type { Recipe, RecipeTemplate, TagCategory } from '@/shared/types'

export interface RecipeViewPageProps {
  recipe: Recipe
  categories: TagCategory[]
  template?: RecipeTemplate | null
  onBack: () => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
  hideTopBar?: boolean
}

export function RecipeViewPage({
  recipe,
  categories,
  template,
  onBack,
  onEdit,
  onDeleteRequest,
  hideTopBar = false,
}: RecipeViewPageProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})
  const [todoDialogOpen, setTodoDialogOpen] = useState(false)

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      {!hideTopBar && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            title="Back"
            className="h-9 w-9 cursor-pointer border-border hover:bg-muted text-foreground"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>

          <ButtonGroup orientation="horizontal" className="border border-border rounded-lg bg-card shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(recipe)}
              title="Edit recipe"
              className="h-9 w-9 text-foreground hover:bg-muted cursor-pointer"
            >
              <Pencil className="h-4.5 w-4.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDeleteRequest(recipe)}
              title="Delete recipe"
              className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </Button>
          </ButtonGroup>
        </div>
      )}

      {/* Hero Media & Metrics */}
      <RecipeHero recipe={recipe} />

      {/* Tags Section */}
      {Object.keys(recipe.tags || {}).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-4 rounded-xl border border-border bg-card">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">
            Tags:
          </span>
          {Object.entries(recipe.tags).map(([catId, tags]) => {
            const category = categories.find((c) => c.id === catId)
            return tags.map((t) => (
              <Badge key={`${catId}-${t}`} variant="secondary" className="text-xs px-2.5 py-1">
                <span className="opacity-50 mr-1.5">{category?.name || catId}:</span>
                <strong>{t}</strong>
              </Badge>
            ))
          })}
        </div>
      )}

      {/* Two Column Layout: Ingredients & Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ingredients Column */}
        <div className="md:col-span-1">
          <RecipeIngredientsList
            ingredients={recipe.ingredients || []}
            checkedIngredients={checkedIngredients}
            onToggleIngredient={toggleIngredient}
            onOpenTodoDialog={() => setTodoDialogOpen(true)}
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

      {/* Additional Template Fields */}
      <RecipeFieldsView
        template={template}
        fieldValues={recipe.field_values}
        categories={categories}
      />

      {/* Microsoft To Do Integration Dialog */}
      <AddToTodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        recipeTitle={recipe.title}
        ingredients={recipe.ingredients || []}
      />
    </div>
  )
}

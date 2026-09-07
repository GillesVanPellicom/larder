import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { normalizeInstructionsToHtml } from '@/lib/instructions'
import type { Recipe, TagCategory } from '@/shared/types'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Pencil,
  Trash2,
  Users,
  Utensils,
} from 'lucide-react'

interface RecipeViewPageProps {
  recipe: Recipe
  categories: TagCategory[]
  onBack: () => void
  onEdit: (recipe: Recipe) => void
  onDeleteRequest: (recipe: Recipe) => void
}

export function RecipeViewPage({
  recipe,
  categories,
  onBack,
  onEdit,
  onDeleteRequest,
}: RecipeViewPageProps) {
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({})

  const toggleIngredient = (id: string) => {
    setCheckedIngredients((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Back to Recipes</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(recipe)}
            className="text-xs cursor-pointer border-border hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            <span>Edit Recipe</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteRequest(recipe)}
            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Hero Media & Title */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        {recipe.image_url ? (
          <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-muted">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold block mb-1">
                Recipe Details
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-sm text-neutral-200 mt-2 max-w-2xl leading-relaxed">
                  {recipe.description}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 border-b border-border">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block mb-1">
              Recipe Details
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-2xl">
                {recipe.description}
              </p>
            )}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border bg-muted/20 text-center p-4">
          <div className="py-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Prep Time
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">
                {recipe.prep_time_minutes > 0 ? `${recipe.prep_time_minutes} min` : '—'}
              </span>
            </div>
          </div>

          <div className="py-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Cook Time
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">
                {recipe.cook_time_minutes > 0 ? `${recipe.cook_time_minutes} min` : '—'}
              </span>
            </div>
          </div>

          <div className="py-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Total Time
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {recipe.total_time_minutes > 0 ? `${recipe.total_time_minutes} min` : '—'}
              </span>
            </div>
          </div>

          <div className="py-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Yield / Servings
            </span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">
                {recipe.yield_amount || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

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
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Utensils className="h-4 w-4 text-amber-500" />
              <span>Ingredients</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {recipe.ingredients?.length || 0}
            </span>
          </div>

          <div className="space-y-1.5 rounded-2xl border border-border bg-card p-3 shadow-xs">
            {(recipe.ingredients || []).map((ing) => {
              const isChecked = Boolean(checkedIngredients[ing.id])
              return (
                <div
                  key={ing.id}
                  onClick={() => toggleIngredient(ing.id)}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                    isChecked
                      ? 'bg-muted/40 border-border text-muted-foreground line-through opacity-70'
                      : 'bg-card border-border/70 hover:bg-muted/30 text-foreground'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 mt-0.5 ${
                      isChecked ? 'text-emerald-500' : 'text-muted-foreground/40'
                    }`}
                  />
                  <div className="leading-snug">
                    {(ing.amount || ing.unit) && (
                      <strong className="mr-1 text-foreground font-semibold">
                        {[ing.amount, ing.unit].filter(Boolean).join(' ')}
                      </strong>
                    )}
                    <span>{ing.name}</span>
                    {ing.notes && (
                      <span className="ml-1 text-muted-foreground italic">
                        ({ing.notes})
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Instructions Column */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span>Preparation Method</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            {normalizeInstructionsToHtml(recipe.instructions) ? (
              <div
                className="recipe-instructions-content"
                dangerouslySetInnerHTML={{
                  __html: normalizeInstructionsToHtml(recipe.instructions),
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No preparation instructions provided for this recipe.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chef's Notes & Source Link */}
      {(recipe.notes || recipe.source_url) && (
        <div className="rounded-2xl border border-border bg-card p-5 text-xs space-y-3 shadow-xs">
          {recipe.notes && (
            <div>
              <span className="font-semibold text-foreground uppercase tracking-wider text-[11px] block mb-1">
                Chef&rsquo;s Notes
              </span>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {recipe.notes}
              </p>
            </div>
          )}

          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-600 hover:underline dark:text-amber-400 font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Visit Original Recipe Source</span>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

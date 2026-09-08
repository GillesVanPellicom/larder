import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { normalizeInstructionsToHtml } from '@/lib/instructions'
import type {
  CreateRecipeDTO,
  IngredientItem,
  MetadataConfig,
  Recipe,
  RecipeTags,
  RecipeTemplate,
  TagCategory,
} from '@/shared/types'
import { ArrowLeft, Check, Image as ImageIcon, X } from 'lucide-react'
import { RecipeBasicFields } from './RecipeBasicFields'
import { RecipeTagsEditor } from './RecipeTagsEditor'
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor'
import { RecipeInstructionsEditor } from './RecipeInstructionsEditor'

export interface RecipeFormPageProps {
  recipe?: Recipe | null
  categories: TagCategory[]
  metadataConfig: MetadataConfig | null
  templates?: RecipeTemplate[]
  onBack: () => void
  onSave: (data: CreateRecipeDTO, id?: number) => Promise<void>
  hideTopBar?: boolean
}

export function RecipeFormPage({
  recipe,
  categories,
  metadataConfig,
  onBack,
  onSave,
  hideTopBar = false,
}: RecipeFormPageProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Form Fields
  const [title, setTitle] = useState(recipe?.title || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [yieldAmount, setYieldAmount] = useState(recipe?.yield_amount || '')
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>(
    recipe?.prep_time_minutes ?? ''
  )
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>(
    recipe?.cook_time_minutes ?? ''
  )
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '')

  const [ingredients, setIngredients] = useState<IngredientItem[]>(
    recipe?.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients
      : [
          { id: '1', name: '', amount: '', unit: '' },
          { id: '2', name: '', amount: '', unit: '' },
        ]
  )

  const [instructionsHtml, setInstructionsHtml] = useState<string>(() =>
    normalizeInstructionsToHtml(recipe?.instructions)
  )

  const [tags, setTags] = useState<RecipeTags>(recipe?.tags || {})

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || '')
      setDescription(recipe.description || '')
      setYieldAmount(recipe.yield_amount || '')
      setPrepTimeMinutes(recipe.prep_time_minutes ?? '')
      setCookTimeMinutes(recipe.cook_time_minutes ?? '')
      setImageUrl(recipe.image_url || '')
      if (recipe.ingredients?.length) setIngredients(recipe.ingredients)
      setInstructionsHtml(normalizeInstructionsToHtml(recipe.instructions))
      if (recipe.tags) setTags(recipe.tags)
    }
  }, [recipe])

  const calculatedTotalTime =
    (Number(prepTimeMinutes) || 0) + (Number(cookTimeMinutes) || 0)

  const mandatory = metadataConfig?.mandatoryFields || {
    title: true,
    ingredients: true,
    instructions: true,
    image_url: false,
    description: false,
    yield_amount: false,
    prep_time_minutes: false,
    cook_time_minutes: false,
    total_time_minutes: false,
  }

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleIngredientChange = (
    index: number,
    field: keyof IngredientItem,
    val: string
  ) => {
    setIngredients((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })
    if (fieldErrors.ingredients) clearFieldError('ingredients')
  }

  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), name: '', amount: '', unit: '' },
    ])
  }

  const removeIngredientRow = (index: number) => {
    setIngredients((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const cleanIngredients = ingredients.filter((i) => i.name.trim().length > 0)
    const finalTitle = title.trim()
    const finalDesc = description.trim()
    const finalYield = yieldAmount.trim()
    const finalPrep = Number(prepTimeMinutes) || 0
    const finalCook = Number(cookTimeMinutes) || 0
    const finalImage = imageUrl.trim()
    const finalIng = cleanIngredients
    const finalInst = instructionsHtml.trim()
    const finalTags = tags

    const nextErrors: Record<string, string> = {}

    // Recipe Details Validation
    if (!finalTitle) {
      nextErrors.title = 'Recipe title is required.'
    }
    if (mandatory.description && !finalDesc) {
      nextErrors.description = 'Description is required.'
    }
    if (mandatory.prep_time_minutes && !finalPrep) {
      nextErrors.prep_time_minutes = 'Prep time is required.'
    }
    if (mandatory.cook_time_minutes && !finalCook) {
      nextErrors.cook_time_minutes = 'Cook time is required.'
    }
    if (mandatory.yield_amount && !finalYield) {
      nextErrors.yield_amount = 'Yield is required.'
    }

    // Cover Image Validation
    if (mandatory.image_url && !finalImage) {
      nextErrors.image_url = 'Cover photo is required.'
    }

    // Ingredients Validation
    if (mandatory.ingredients !== false && finalIng.length === 0) {
      nextErrors.ingredients = 'At least one ingredient is required.'
    }

    // Instructions Validation
    const isInstEmpty =
      !finalInst ||
      finalInst === '<p><br></p>' ||
      finalInst === '<p></p>' ||
      finalInst.replace(/<[^>]*>/g, '').trim().length === 0
    if (mandatory.instructions !== false && isInstEmpty) {
      nextErrors.instructions = 'Instructions are required.'
    }

    // Category Tag Range Validation
    for (const cat of categories) {
      const selected = finalTags[cat.id] || []
      const totalCatTags = cat.tags?.length || 0
      const minAllowed =
        cat.min_tags !== undefined
          ? cat.min_tags
          : cat.exclusive
          ? 1
          : 0
      const maxAllowed =
        cat.max_tags !== undefined
          ? cat.max_tags
          : cat.exclusive
          ? 1
          : totalCatTags

      if (selected.length < minAllowed) {
        nextErrors[`tags.${cat.id}`] =
          minAllowed === 1
            ? `Please select a tag for ${cat.name}.`
            : `Please select at least ${minAllowed} tags for ${cat.name}.`
      } else if (maxAllowed > 0 && selected.length > maxAllowed) {
        nextErrors[`tags.${cat.id}`] =
          maxAllowed === 1
            ? `Only 1 tag allowed for ${cat.name}.`
            : `Please select at most ${maxAllowed} tags for ${cat.name}.`
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      const firstErrorMessage = Object.values(nextErrors)[0]
      setError(firstErrorMessage || 'Please complete all required fields.')
      return
    }

    try {
      setSubmitting(true)
      const payload: CreateRecipeDTO = {
        title: finalTitle || 'Untitled Recipe',
        description: finalDesc,
        yield_amount: finalYield,
        prep_time_minutes: finalPrep,
        cook_time_minutes: finalCook,
        total_time_minutes: finalPrep + finalCook,
        image_url: finalImage,
        source_url: recipe?.source_url || '',
        notes: recipe?.notes || '',
        ingredients: finalIng,
        instructions: finalInst,
        tags: finalTags,
        template_id: recipe?.template_id || 'tpl_default',
        template_version_id: recipe?.template_version_id || 1,
        field_values: {
          ...recipe?.field_values,
          title: finalTitle,
          description: finalDesc,
          yield_amount: finalYield,
          prep_time_minutes: finalPrep,
          cook_time_minutes: finalCook,
          total_time_minutes: finalPrep + finalCook,
          image_url: finalImage,
          ingredients: finalIng,
          instructions: finalInst,
          tags: finalTags,
        },
      }

      await onSave(payload, recipe ? recipe.id : undefined)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save recipe.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      {!hideTopBar && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              title="Back to Recipes"
              className="h-9 w-9 cursor-pointer border-border hover:bg-muted text-foreground"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {recipe ? 'Edit Recipe' : 'New Recipe'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onBack}
              className="cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="recipe-form"
              variant="outline"
              disabled={submitting}
              className="cursor-pointer font-semibold min-w-28 border-border bg-card hover:bg-muted text-foreground"
            >
              {submitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />{' '}
                  {recipe ? 'Save Changes' : 'Create Recipe'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Global Form Error Banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive animate-in fade-in">
          {error}
        </div>
      )}

      {/* Set Sequence Form Body */}
      <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Recipe Details (Title, Description, Times, Yield with Steppers) */}
        <RecipeBasicFields
          title={title}
          onTitleChange={setTitle}
          description={description}
          onDescriptionChange={setDescription}
          prepTimeMinutes={prepTimeMinutes}
          onPrepTimeChange={setPrepTimeMinutes}
          cookTimeMinutes={cookTimeMinutes}
          onCookTimeChange={setCookTimeMinutes}
          calculatedTotalTime={calculatedTotalTime}
          yieldAmount={yieldAmount}
          onYieldChange={setYieldAmount}
          mandatory={mandatory}
          fieldErrors={fieldErrors}
          onClearFieldError={clearFieldError}
        />

        {/* 2. Cover Photo */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Cover Photo {mandatory.image_url && <span className="text-destructive">*</span>}
            </h2>
            <InfoTooltip content="Add a high-quality photo URL for this recipe. A preview will be shown below." />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value)
                  if (fieldErrors.image_url) clearFieldError('image_url')
                }}
                className={`pl-9 pr-9 ${fieldErrors.image_url ? 'border-destructive ring-destructive/20 ring-2' : ''}`}
              />
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              {Boolean(imageUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('')
                    if (fieldErrors.image_url) clearFieldError('image_url')
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  title="Clear image URL"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {fieldErrors.image_url && (
              <span className="text-[11px] text-destructive block">
                {fieldErrors.image_url}
              </span>
            )}

            {Boolean(imageUrl) && (
              <div className="relative h-48 sm:h-64 w-full rounded-xl overflow-hidden border border-border bg-muted/20">
                <img
                  src={imageUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Tags (Categories with Selection Range Rules) */}
        <RecipeTagsEditor
          categories={categories}
          tags={tags}
          onTagsChange={setTags}
          mandatoryCategories={categories.filter((c) => (c.min_tags || 0) > 0 || c.exclusive).map((c) => c.id)}
          fieldErrors={fieldErrors}
          onClearFieldError={clearFieldError}
        />

        {/* 4. Ingredients Table */}
        <RecipeIngredientsEditor
          ingredients={ingredients}
          onIngredientChange={handleIngredientChange}
          onAddRow={addIngredientRow}
          onRemoveRow={removeIngredientRow}
          isMandatory={Boolean(mandatory.ingredients !== false)}
          error={fieldErrors.ingredients}
        />

        {/* 5. Instructions Editor */}
        <RecipeInstructionsEditor
          value={instructionsHtml}
          onChange={(html) => {
            setInstructionsHtml(html)
            if (fieldErrors.instructions) clearFieldError('instructions')
          }}
          isMandatory={Boolean(mandatory.instructions !== false)}
          error={fieldErrors.instructions}
        />

        {/* Bottom Save Bar for easy access on long recipes */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="outline"
            disabled={submitting}
            className="cursor-pointer font-semibold min-w-28 border-border bg-card hover:bg-muted text-foreground"
          >
            {submitting ? (
              'Saving...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-1.5" />{' '}
                {recipe ? 'Save Changes' : 'Create Recipe'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

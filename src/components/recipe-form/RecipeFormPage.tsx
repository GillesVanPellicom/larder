import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { normalizeInstructionsToHtml } from '@/lib/instructions'
import { validateRecipeForm } from '@/lib/recipeValidation'
import { DynamicFieldInput } from '@/components/template-engine/DynamicFieldInput'
import type {
  CreateRecipeDTO,
  IngredientItem,
  MetadataConfig,
  Recipe,
  RecipeTags,
  RecipeTemplate,
  TagCategory,
} from '@/shared/types'
import { ArrowLeft, Check, LayoutTemplate } from 'lucide-react'
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
  templates = [],
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
    recipe?.prep_time_minutes || ''
  )
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>(
    recipe?.cook_time_minutes || ''
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

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    recipe?.template_id || templates.find((t) => t.isDefault)?.id || templates[0]?.id || 'tpl_default'
  )
  const [dynamicValues, setDynamicValues] = useState<Record<string, unknown>>(() => {
    return recipe?.field_values || {}
  })

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || '')
      setDescription(recipe.description || '')
      setYieldAmount(recipe.yield_amount || '')
      setPrepTimeMinutes(recipe.prep_time_minutes || '')
      setCookTimeMinutes(recipe.cook_time_minutes || '')
      setImageUrl(recipe.image_url || '')
      if (recipe.ingredients?.length) setIngredients(recipe.ingredients)
      setInstructionsHtml(normalizeInstructionsToHtml(recipe.instructions))
      if (recipe.tags) setTags(recipe.tags)
      if (recipe.template_id) setSelectedTemplateId(recipe.template_id)
      if (recipe.field_values) setDynamicValues(recipe.field_values)
    }
  }, [recipe])

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

  const calculatedTotalTime =
    (Number(prepTimeMinutes) || 0) + (Number(cookTimeMinutes) || 0)

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

    const activeTemplate =
      templates.find((t) => t.id === selectedTemplateId) ||
      templates.find((t) => t.isDefault) ||
      templates[0] ||
      null

    const isCustomTemplate = Boolean(
      activeTemplate &&
      activeTemplate.id !== 'tpl_default' &&
      activeTemplate.currentVersion?.fieldsSchema?.length
    )

    const finalTitle = String(dynamicValues.fld_title || title || '').trim()
    const finalDesc = String(dynamicValues.fld_description || description || '').trim()
    const finalYield = String(dynamicValues.fld_yield || yieldAmount || '').trim()
    const finalPrep = Number(dynamicValues.fld_prep_time) || Number(prepTimeMinutes) || 0
    const finalCook = Number(dynamicValues.fld_cook_time) || Number(cookTimeMinutes) || 0
    const finalImage = String(dynamicValues.fld_image || imageUrl || '').trim()
    const finalIng = (dynamicValues.fld_ingredients as IngredientItem[]) || cleanIngredients
    const finalInst = (dynamicValues.fld_instructions as string) || instructionsHtml
    const finalTags = (dynamicValues.fld_tags as RecipeTags) || tags

    if (!isCustomTemplate) {
      const validation = validateRecipeForm(
        {
          title,
          description,
          yield_amount: yieldAmount,
          prep_time_minutes: prepTimeMinutes,
          cook_time_minutes: cookTimeMinutes,
          image_url: imageUrl,
          ingredients: cleanIngredients,
          instructions: instructionsHtml,
          tags,
        },
        metadataConfig,
        categories
      )

      if (!validation.valid) {
        const firstErrorMessage = Object.values(validation.errors)[0]
        setError(firstErrorMessage || 'Please correct the validation errors.')
        setFieldErrors(validation.errors)
        return
      }
    } else if (activeTemplate?.currentVersion?.fieldsSchema) {
      // Validate template custom fields
      for (const f of activeTemplate.currentVersion.fieldsSchema) {
        if (f.required && !f.isArchived && f.type !== 'separator') {
          const val = dynamicValues[f.id]
          if (
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.length === 0)
          ) {
            setError(`"${f.name}" is required by this template.`)
            setFieldErrors({ [f.id]: `${f.name} is required.` })
            return
          }
        }
      }
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
        template_id: activeTemplate?.id || 'tpl_default',
        template_version_id: activeTemplate?.currentVersion?.version || 1,
        field_values: {
          ...dynamicValues,
          fld_title: finalTitle,
          fld_description: finalDesc,
          fld_yield: finalYield,
          fld_prep_time: finalPrep,
          fld_cook_time: finalCook,
          fld_total_time: finalPrep + finalCook,
          fld_image: finalImage,
          fld_ingredients: finalIng,
          fld_instructions: finalInst,
          fld_tags: finalTags,
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

  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) ||
    templates.find((t) => t.isDefault) ||
    templates[0] ||
    null

  const isCustomTemplate = Boolean(
    activeTemplate &&
    activeTemplate.id !== 'tpl_default' &&
    activeTemplate.currentVersion?.fieldsSchema?.length
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      {!hideTopBar && (
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            title="Back to Recipes"
            className="h-9 w-9 cursor-pointer border-border hover:bg-muted text-foreground"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>

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
              {submitting ? 'Saving...' : <><Check className="h-4 w-4 mr-1.5" /> {recipe ? 'Save Changes' : 'Create Recipe'}</>}
            </Button>
          </div>
        </div>
      )}

      {/* Template Selector Bar (When multiple templates exist) */}
      {templates.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-xs">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Recipe Template:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                  selectedTemplateId === tpl.id
                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-xs'
                    : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Global Form Error Banner */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-semibold text-destructive animate-in fade-in">
          {error}
        </div>
      )}

      {/* Form Body */}
      <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6">
        {isCustomTemplate ? (
          <div className="space-y-5">
            {activeTemplate.currentVersion!.fieldsSchema.map((f) => (
              <div
                key={f.id}
                className={
                  f.type === 'separator'
                    ? ''
                    : 'rounded-2xl border border-border bg-card p-6 shadow-xs'
                }
              >
                <DynamicFieldInput
                  field={f}
                  value={dynamicValues[f.id]}
                  onChange={(val) => {
                    setDynamicValues((prev) => ({ ...prev, [f.id]: val }))
                    if (f.id === 'fld_title' && typeof val === 'string') setTitle(val)
                    if (f.id === 'fld_image' && typeof val === 'string') setImageUrl(val)
                  }}
                  categories={categories}
                  error={fieldErrors[f.id]}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
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
              imageUrl={imageUrl}
              onImageUrlChange={setImageUrl}
              mandatory={mandatory}
              fieldErrors={fieldErrors}
              onClearFieldError={clearFieldError}
            />

            <RecipeTagsEditor
              categories={categories}
              tags={tags}
              onTagsChange={setTags}
              mandatoryCategories={metadataConfig?.mandatoryCategories}
              fieldErrors={fieldErrors}
              onClearFieldError={clearFieldError}
            />

            <RecipeIngredientsEditor
              ingredients={ingredients}
              onIngredientChange={handleIngredientChange}
              onAddRow={addIngredientRow}
              onRemoveRow={removeIngredientRow}
              isMandatory={Boolean(mandatory.ingredients)}
              error={fieldErrors.ingredients}
            />

            <RecipeInstructionsEditor
              value={instructionsHtml}
              onChange={(html) => {
                setInstructionsHtml(html)
                if (fieldErrors.instructions) clearFieldError('instructions')
              }}
              isMandatory={Boolean(mandatory.instructions)}
              error={fieldErrors.instructions}
            />
          </>
        )}
      </form>
    </div>
  )
}

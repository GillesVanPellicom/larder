import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { ArrowLeft } from 'lucide-react'
import { ConfirmUnsavedDialog } from '@/components/ConfirmUnsavedDialog'
import { RecipeBasicFields } from './RecipeBasicFields'
import { RecipeImageUpload } from './RecipeImageUpload'
import { RecipeTagsEditor } from './RecipeTagsEditor'
import { RecipeIngredientsEditor } from './RecipeIngredientsEditor'
import { RecipeInstructionsEditor } from './RecipeInstructionsEditor'
import { SaveBar } from '@/components/ui/save-bar'

export interface RecipeFormPageProps {
  recipe?: Recipe | null
  categories: TagCategory[]
  metadataConfig: MetadataConfig | null
  templates?: RecipeTemplate[]
  onBack: () => void
  onSave: (data: CreateRecipeDTO, id?: number) => Promise<Recipe | void>
  hideTopBar?: boolean
}

const DEFAULT_INGREDIENTS: IngredientItem[] = [
  { id: '1', name: '', amount: '', unit: '' },
  { id: '2', name: '', amount: '', unit: '' },
]

function normalizeHtml(html: string): string {
  return (html || '')
    .replace(/<span class="ql-ui"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<p><br\s*\/?><\/p>|<p><\/p>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeIngredients(items: IngredientItem[] | undefined): Array<{ name: string; amount: string; unit: string }> {
  if (!items || !Array.isArray(items)) return []
  return items.map((i) => ({
    name: String(i?.name ?? '').trim(),
    amount: String(i?.amount ?? '').trim(),
    unit: String(i?.unit ?? '').trim(),
  }))
}

function normalizeTags(t: RecipeTags | undefined): Record<string, string[]> {
  const res: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(t || {})) {
    if (Array.isArray(v) && v.length > 0) {
      res[k] = [...v].sort()
    }
  }
  return res
}

function getInitialValues(r?: Recipe | null) {
  const prep = typeof r?.prep_time_minutes === 'number' ? r.prep_time_minutes : ''
  const cook = typeof r?.cook_time_minutes === 'number' ? r.cook_time_minutes : ''
  const rawIngs =
    r?.ingredients && r.ingredients.length > 0
      ? r.ingredients
      : DEFAULT_INGREDIENTS
  const cleanIngs = rawIngs.map((i, idx) => ({
    id: i.id || String(idx + 1),
    name: String(i?.name ?? ''),
    amount: String(i?.amount ?? ''),
    unit: String(i?.unit ?? ''),
  }))

  return {
    title: String(r?.title ?? '').trim(),
    description: String(r?.description ?? '').trim(),
    yieldAmount: typeof r?.yield_amount === 'number' ? r.yield_amount : (parseInt(String(r?.yield_amount ?? '4'), 10) || 4),
    yieldUnit: String(r?.yield_unit || 'servings').trim(),
    prepTimeMinutes: prep as number | '',
    cookTimeMinutes: cook as number | '',
    imageUrl: String(r?.image_url ?? '').trim(),
    sourceUrl: String(r?.source_url ?? '').trim(),
    ingredients: cleanIngs,
    instructionsHtml: normalizeInstructionsToHtml(r?.instructions),
    tags: (r?.tags ? JSON.parse(JSON.stringify(r.tags)) : {}) as RecipeTags,
  }
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
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null | undefined>(recipe)

  const timeTrackingMode = metadataConfig?.timeTrackingMode || 'prep_and_cook'

  const [initialState, setInitialState] = useState(() => getInitialValues(recipe))

  // Form Fields
  const [title, setTitle] = useState(initialState.title)
  const [description, setDescription] = useState(initialState.description)
  const [yieldAmount, setYieldAmount] = useState<number | ''>(initialState.yieldAmount)
  const [yieldUnit, setYieldUnit] = useState<string>(initialState.yieldUnit)
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>(
    initialState.prepTimeMinutes
  )
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>(
    initialState.cookTimeMinutes
  )
  const [imageUrl, setImageUrl] = useState(initialState.imageUrl)
  const [sourceUrl, setSourceUrl] = useState(initialState.sourceUrl)
  const [ingredients, setIngredients] = useState<IngredientItem[]>(
    initialState.ingredients
  )
  const [instructionsHtml, setInstructionsHtml] = useState<string>(
    initialState.instructionsHtml
  )
  const [tags, setTags] = useState<RecipeTags>(initialState.tags)

  useEffect(() => {
    setCurrentRecipe(recipe)
    const init = getInitialValues(recipe)
    setInitialState(init)
    setTitle(init.title)
    setDescription(init.description)
    setYieldAmount(init.yieldAmount)
    setYieldUnit(init.yieldUnit)
    setPrepTimeMinutes(init.prepTimeMinutes)
    setCookTimeMinutes(init.cookTimeMinutes)
    setImageUrl(init.imageUrl)
    setSourceUrl(init.sourceUrl)
    setIngredients(init.ingredients)
    setInstructionsHtml(init.instructionsHtml)
    setTags(init.tags)
  }, [recipe])

  const isDirty = useMemo(() => {
    const diffs: string[] = []

    if (title.trim() !== initialState.title) {
      diffs.push(`title: "${title.trim()}" !== "${initialState.title}"`)
    }
    if (description.trim() !== initialState.description) {
      diffs.push(`description: "${description.trim()}" !== "${initialState.description}"`)
    }
    const curYieldAmt = typeof yieldAmount === 'number' ? yieldAmount : 0
    const initYieldAmt = typeof initialState.yieldAmount === 'number' ? initialState.yieldAmount : 0
    if (curYieldAmt !== initYieldAmt) {
      diffs.push(`yieldAmount: ${curYieldAmt} !== ${initYieldAmt}`)
    }
    if (yieldUnit.trim() !== initialState.yieldUnit) {
      diffs.push(`yieldUnit: "${yieldUnit.trim()}" !== "${initialState.yieldUnit}"`)
    }

    const curPrep = typeof prepTimeMinutes === 'number' ? prepTimeMinutes : 0
    const initPrep = typeof initialState.prepTimeMinutes === 'number' ? initialState.prepTimeMinutes : 0
    if (curPrep !== initPrep) {
      diffs.push(`prepTimeMinutes: ${curPrep} !== ${initPrep}`)
    }

    const curCook = typeof cookTimeMinutes === 'number' ? cookTimeMinutes : 0
    const initCook = typeof initialState.cookTimeMinutes === 'number' ? initialState.cookTimeMinutes : 0
    if (curCook !== initCook) {
      diffs.push(`cookTimeMinutes: ${curCook} !== ${initCook}`)
    }

    if (imageUrl.trim() !== initialState.imageUrl) {
      diffs.push(`imageUrl: "${imageUrl.trim()}" !== "${initialState.imageUrl}"`)
    }

    if (sourceUrl.trim() !== initialState.sourceUrl) {
      diffs.push(`sourceUrl: "${sourceUrl.trim()}" !== "${initialState.sourceUrl}"`)
    }

    const curInst = normalizeHtml(instructionsHtml)
    const initInst = normalizeHtml(initialState.instructionsHtml)
    if (curInst !== initInst) {
      diffs.push(`instructionsHtml: "${curInst}" !== "${initInst}"`)
    }

    const curIngs = normalizeIngredients(ingredients)
    const initIngs = normalizeIngredients(initialState.ingredients)
    if (JSON.stringify(curIngs) !== JSON.stringify(initIngs)) {
      diffs.push(`ingredients: ${JSON.stringify(curIngs)} !== ${JSON.stringify(initIngs)}`)
    }

    const curTags = normalizeTags(tags)
    const initTags = normalizeTags(initialState.tags)
    if (JSON.stringify(curTags) !== JSON.stringify(initTags)) {
      diffs.push(`tags: ${JSON.stringify(curTags)} !== ${JSON.stringify(initTags)}`)
    }

    if (diffs.length > 0) {
      console.log('[RecipeForm isDirty Telemetry]:', diffs)
      return true
    }
    return false
  }, [
    title,
    description,
    yieldAmount,
    yieldUnit,
    prepTimeMinutes,
    cookTimeMinutes,
    imageUrl,
    sourceUrl,
    instructionsHtml,
    ingredients,
    tags,
    initialState,
  ])

  const handleDiscard = () => {
    setTitle(initialState.title)
    setDescription(initialState.description)
    setYieldAmount(initialState.yieldAmount)
    setYieldUnit(initialState.yieldUnit)
    setPrepTimeMinutes(initialState.prepTimeMinutes)
    setCookTimeMinutes(initialState.cookTimeMinutes)
    setImageUrl(initialState.imageUrl)
    setSourceUrl(initialState.sourceUrl)
    setIngredients(initialState.ingredients)
    setInstructionsHtml(initialState.instructionsHtml)
    setTags(initialState.tags)
    setFieldErrors({})
    setError(null)
  }

  const mandatory = metadataConfig?.mandatoryFields || {
    title: true,
    ingredients: true,
    instructions: true,
    image_url: false,
    description: false,
    yield_amount: false,
    prep_time_minutes: false,
    cook_time_minutes: false,
    source_url: false,
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
    const finalYieldAmt = typeof yieldAmount === 'number' ? yieldAmount : 0
    const finalYieldUnit = yieldUnit.trim() || 'servings'
    const finalPrep = timeTrackingMode !== 'no_cook' ? Number(prepTimeMinutes) || 0 : 0
    const finalCook = timeTrackingMode === 'prep_and_cook' ? Number(cookTimeMinutes) || 0 : 0
    const finalTotal = timeTrackingMode === 'prep_and_cook' ? finalPrep + finalCook : timeTrackingMode === 'total_only' ? finalPrep : 0
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
    if (timeTrackingMode !== 'no_cook' && mandatory.prep_time_minutes && !finalPrep) {
      nextErrors.prep_time_minutes =
        timeTrackingMode === 'total_only'
          ? 'Total time is required.'
          : 'Prep time is required.'
    }
    if (timeTrackingMode === 'prep_and_cook' && mandatory.cook_time_minutes && !finalCook) {
      nextErrors.cook_time_minutes = 'Cook time is required.'
    }
    if (mandatory.yield_amount && (!finalYieldAmt || finalYieldAmt <= 0)) {
      nextErrors.yield_amount = 'Yield is required.'
    }
    const finalSourceUrl = sourceUrl.trim()
    if (mandatory.source_url && !finalSourceUrl) {
      nextErrors.source_url = 'Originally adapted from is required.'
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
      setError('Some choices are invalid')
      const firstField = Object.keys(nextErrors)[0]
      if (firstField) {
        setTimeout(() => {
          const el = document.querySelector(`[data-field="${firstField}"]`)
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const focusable = el.querySelector<HTMLElement>('input, textarea, button, [tabindex="0"]')
            if (focusable) {
              focusable.focus()
            }
          }
        }, 50)
      }
      return
    }

    try {
      setSubmitting(true)
      const activeId = currentRecipe?.id ?? recipe?.id
      const payload: CreateRecipeDTO = {
        title: finalTitle || 'Untitled Recipe',
        description: finalDesc,
        yield_amount: finalYieldAmt || 4,
        yield_unit: finalYieldUnit,
        prep_time_minutes: finalPrep,
        cook_time_minutes: finalCook,
        total_time_minutes: finalTotal,
        image_url: finalImage,
        source_url: finalSourceUrl,
        ingredients: finalIng,
        instructions: finalInst,
        tags: finalTags,
      }

      const saved = await onSave(payload, activeId)
      if (saved) {
        setCurrentRecipe(saved)
        const nextInit = getInitialValues(saved)
        setInitialState(nextInit)
        setTitle(nextInit.title)
        setDescription(nextInit.description)
        setYieldAmount(nextInit.yieldAmount)
        setYieldUnit(nextInit.yieldUnit)
        setPrepTimeMinutes(nextInit.prepTimeMinutes)
        setCookTimeMinutes(nextInit.cookTimeMinutes)
        setImageUrl(nextInit.imageUrl)
        setSourceUrl(nextInit.sourceUrl)
        setIngredients(nextInit.ingredients)
        setInstructionsHtml(nextInit.instructionsHtml)
        setTags(nextInit.tags)
      } else {
        const nextInit = getInitialValues({
          id: activeId || 0,
          title: finalTitle,
          description: finalDesc,
          yield_amount: finalYieldAmt || 4,
          yield_unit: finalYieldUnit,
          prep_time_minutes: finalPrep,
          cook_time_minutes: finalCook,
          total_time_minutes: finalTotal,
          image_url: finalImage,
          source_url: finalSourceUrl,
          ingredients: finalIng,
          instructions: finalInst,
          tags: finalTags,
          created_at: '',
          updated_at: '',
        })
        setInitialState(nextInit)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save recipe.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleBackClick = () => {
    if (isDirty) {
      setShowBackConfirm(true)
    } else {
      onBack()
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-32 sm:pb-36 animate-in fade-in duration-150">
      {/* Top Action Bar */}
      {!hideTopBar && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackClick}
              title="Back to Recipes"
              className="h-9 w-9 cursor-pointer border-border hover:bg-muted text-foreground"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {recipe ? 'Edit' : 'New'}
            </h1>
          </div>
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
          yieldAmount={yieldAmount}
          onYieldAmountChange={setYieldAmount}
          yieldUnit={yieldUnit}
          onYieldUnitChange={setYieldUnit}
          sourceUrl={sourceUrl}
          onSourceUrlChange={setSourceUrl}
          mandatory={mandatory}
          fieldErrors={fieldErrors}
          onClearFieldError={clearFieldError}
          timeTrackingMode={timeTrackingMode}
        />

        {/* 2. Cover Photo Attachment */}
        <RecipeImageUpload
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          isMandatory={Boolean(mandatory.image_url)}
          error={fieldErrors.image_url}
          onClearError={() => clearFieldError('image_url')}
        />

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
          onReorder={setIngredients}
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
      </form>

      {/* Floating Sticky Save Bar */}
      <SaveBar
        isDirty={isDirty}
        submitting={submitting}
        error={error}
        onDiscard={handleDiscard}
        formId="recipe-form"
      />

      {/* Confirmation Dialog for Back Navigation */}
      <ConfirmUnsavedDialog
        open={showBackConfirm}
        onOpenChange={setShowBackConfirm}
        onConfirmDiscard={() => {
          setShowBackConfirm(false)
          onBack()
        }}
        title="Discard unsaved changes?"
        description="You have unsaved recipe changes that will be lost if you leave this page."
      />
    </div>
  )
}

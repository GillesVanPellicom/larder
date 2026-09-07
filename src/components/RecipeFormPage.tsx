import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MultiSelect } from '@/components/MultiSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { QuillEditor } from '@/components/QuillEditor'
import { getInstructionsPlainText, normalizeInstructionsToHtml } from '@/lib/instructions'
import type {
  CreateRecipeDTO,
  IngredientItem,
  MetadataConfig,
  Recipe,
  RecipeTags,
  TagCategory,
} from '@/shared/types'
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react'

interface RecipeFormPageProps {
  recipe?: Recipe | null
  categories: TagCategory[]
  metadataConfig: MetadataConfig | null
  onBack: () => void
  onSave: (data: CreateRecipeDTO, id?: number) => Promise<void>
}

export function RecipeFormPage({
  recipe,
  categories,
  metadataConfig,
  onBack,
  onSave,
}: RecipeFormPageProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fields
  const [title, setTitle] = useState(recipe?.title || '')
  const [description, setDescription] = useState(recipe?.description || '')
  const [yieldAmount, setYieldAmount] = useState(recipe?.yield_amount || '')
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>(
    recipe?.prep_time_minutes || ''
  )
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | ''>(
    recipe?.cook_time_minutes || ''
  )
  const [totalTimeMinutes, setTotalTimeMinutes] = useState<number | ''>(
    recipe?.total_time_minutes || ''
  )
  const [imageUrl, setImageUrl] = useState(recipe?.image_url || '')
  const [sourceUrl, setSourceUrl] = useState(recipe?.source_url || '')
  const [notes, setNotes] = useState(recipe?.notes || '')

  const [ingredients, setIngredients] = useState<IngredientItem[]>(
    recipe?.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients
      : [
          { id: '1', name: '', amount: '', unit: '', notes: '' },
          { id: '2', name: '', amount: '', unit: '', notes: '' },
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
      setPrepTimeMinutes(recipe.prep_time_minutes || '')
      setCookTimeMinutes(recipe.cook_time_minutes || '')
      setTotalTimeMinutes(recipe.total_time_minutes || '')
      setImageUrl(recipe.image_url || '')
      setSourceUrl(recipe.source_url || '')
      setNotes(recipe.notes || '')
      if (recipe.ingredients?.length) setIngredients(recipe.ingredients)
      setInstructionsHtml(normalizeInstructionsToHtml(recipe.instructions))
      if (recipe.tags) setTags(recipe.tags)
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

  // Ingredient Helpers
  const handleIngredientChange = (index: number, field: keyof IngredientItem, val: string) => {
    setIngredients((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })
  }

  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), name: '', amount: '', unit: '', notes: '' },
    ])
  }

  const removeIngredientRow = (index: number) => {
    setIngredients((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (mandatory.title && !title.trim()) {
      setError('Title is mandatory.')
      return
    }

    if (mandatory.image_url && !imageUrl.trim()) {
      setError('Image URL is mandatory under current metadata rules.')
      return
    }

    if (mandatory.description && !description.trim()) {
      setError('Description is mandatory.')
      return
    }

    if (mandatory.yield_amount && !yieldAmount.trim()) {
      setError('Yield / Servings is mandatory.')
      return
    }

    const cleanIngredients = ingredients.filter((i) => i.name.trim().length > 0)
    if (mandatory.ingredients && cleanIngredients.length === 0) {
      setError('At least one ingredient is required.')
      return
    }

    const instructionsPlainText = getInstructionsPlainText(instructionsHtml)
    if (mandatory.instructions && !instructionsPlainText) {
      setError('Instructions / preparation method is required under current metadata rules.')
      return
    }

    const prep = Number(prepTimeMinutes) || 0
    const cook = Number(cookTimeMinutes) || 0
    const total = Number(totalTimeMinutes) || (prep + cook)

    try {
      setSubmitting(true)
      const payload: CreateRecipeDTO = {
        title: title.trim(),
        description: description.trim(),
        yield_amount: yieldAmount.trim(),
        prep_time_minutes: prep,
        cook_time_minutes: cook,
        total_time_minutes: total,
        image_url: imageUrl.trim(),
        source_url: sourceUrl.trim(),
        notes: notes.trim(),
        ingredients: cleanIngredients,
        instructions: instructionsHtml,
        tags,
      }

      await onSave(payload, recipe ? recipe.id : undefined)
      onBack()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save recipe.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          <span>Cancel</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
            className="cursor-pointer text-xs"
          >
            <Check className="h-4 w-4 mr-1.5" />
            {submitting ? 'Saving...' : recipe ? 'Save Changes' : 'Publish Recipe'}
          </Button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {recipe ? 'Edit Recipe' : 'Create New Recipe'}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Fields marked with (<span className="text-destructive font-bold">*</span>) are mandatory based on current metadata settings.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-semibold text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Attributes Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Basic Information
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Recipe Title {mandatory.title && <span className="text-destructive">*</span>}
            </label>
            <Input
              placeholder="e.g. Risotto alla Milanese"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm font-medium"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Description / Overview {mandatory.description && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder="A brief history, flavor profile, or serving context"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Times and Yield Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Prep Time (min) {mandatory.prep_time_minutes && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="number"
                min="0"
                placeholder="15"
                value={prepTimeMinutes}
                onChange={(e) =>
                  setPrepTimeMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Cook Time (min) {mandatory.cook_time_minutes && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="number"
                min="0"
                placeholder="25"
                value={cookTimeMinutes}
                onChange={(e) =>
                  setCookTimeMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Total Time (min) {mandatory.total_time_minutes && <span className="text-destructive">*</span>}
              </label>
              <Input
                type="number"
                min="0"
                placeholder={
                  prepTimeMinutes !== '' || cookTimeMinutes !== ''
                    ? String((Number(prepTimeMinutes) || 0) + (Number(cookTimeMinutes) || 0))
                    : '40'
                }
                value={totalTimeMinutes}
                onChange={(e) =>
                  setTotalTimeMinutes(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Yield / Servings {mandatory.yield_amount && <span className="text-destructive">*</span>}
              </label>
              <Input
                placeholder="4 servings"
                value={yieldAmount}
                onChange={(e) => setYieldAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-foreground">
              Image URL {mandatory.image_url && <span className="text-destructive">*</span>}
            </label>
            <Input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Tags and Categories Selection */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Tags & Taxonomies
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Categorize this dish. Single-choice categories use dropdowns; multi-choice categories support selecting multiple tags.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const selectedInCat = tags[cat.id] || []
              const isMandatoryCat = metadataConfig?.mandatoryCategories?.includes(cat.id)

              if (cat.exclusive) {
                // Exclusive (Single choice) Category: Select aligned with trigger
                return (
                  <div key={cat.id} className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {cat.name}
                        </span>
                        {isMandatoryCat && <span className="text-destructive text-xs font-bold shrink-0">*</span>}
                      </div>
                      <Badge variant="outline" className="text-[10px] font-normal py-0 px-1 text-muted-foreground shrink-0">
                        Single
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex-1">
                        <Select
                          value={selectedInCat[0] || ''}
                          onValueChange={(val) => {
                            setTags((prev) => {
                              const next = { ...prev }
                              if (val) {
                                next[cat.id] = [val]
                              } else {
                                delete next[cat.id]
                              }
                              return next
                            })
                          }}
                        >
                          <SelectTrigger className="w-full text-xs h-8.5 bg-card">
                            <SelectValue placeholder={`Select ${cat.name}...`} />
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger>
                            {(cat.tags || []).map((tag) => (
                              <SelectItem key={tag} value={tag}>
                                {tag}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedInCat.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          title="Clear tag"
                          onClick={() => {
                            setTags((prev) => {
                              const next = { ...prev }
                              delete next[cat.id]
                              return next
                            })
                          }}
                          className="h-8.5 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              }

              // Non-Exclusive Category: MultiSelect component with trigger
              return (
                <div key={cat.id} className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {cat.name}
                      </span>
                      {isMandatoryCat && <span className="text-destructive text-xs font-bold shrink-0">*</span>}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-normal py-0 px-1 text-muted-foreground shrink-0">
                      Multi
                    </Badge>
                  </div>

                  <MultiSelect
                    options={cat.tags || []}
                    values={selectedInCat}
                    onValuesChange={(vals) => {
                      setTags((prev) => {
                        const next = { ...prev }
                        if (vals.length > 0) {
                          next[cat.id] = vals
                        } else {
                          delete next[cat.id]
                        }
                        return next
                      })
                    }}
                    placeholder={`Select ${cat.name}...`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Ingredients Form Section */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Ingredients {mandatory.ingredients && <span className="text-destructive">*</span>}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Press Enter on any field to add the next ingredient row.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={addIngredientRow}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Row
            </Button>
          </div>

          <div className="space-y-2">
            {ingredients.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  placeholder="Qty"
                  value={item.amount || ''}
                  onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                  className="w-20 shrink-0 text-sm"
                />
                <Input
                  placeholder="Unit (g, cup)"
                  value={item.unit || ''}
                  onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                  className="w-28 shrink-0 text-sm"
                />
                <Input
                  placeholder="Ingredient name"
                  value={item.name}
                  onChange={(e) => handleIngredientChange(idx, 'name', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredientRow()
                    }
                  }}
                  className="flex-1 text-sm font-medium"
                />
                <Input
                  placeholder="Notes (optional)"
                  value={item.notes || ''}
                  onChange={(e) => handleIngredientChange(idx, 'notes', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredientRow()
                    }
                  }}
                  className="w-36 hidden sm:block text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => removeIngredientRow(idx)}
                  disabled={ingredients.length <= 1}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions Form Section (Quill Editor) */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Instructions / Method {mandatory.instructions && <span className="text-destructive">*</span>}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Freeform instructions and steps. Use the editor toolbar for bold, italic, underline, lists, or links.
            </p>
          </div>

          <QuillEditor
            value={instructionsHtml}
            onChange={setInstructionsHtml}
            placeholder="Type your recipe instructions, preparation method, culinary tips, and notes freely..."
            minHeight="240px"
          />
        </div>

        {/* Chef's Notes & Source */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Additional Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Original Recipe Source URL
              </label>
              <Input
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Chef Notes / Tips
              </label>
              <Input
                placeholder="Secrets, resting tips, wine pairings..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving Recipe...' : recipe ? 'Save Changes' : 'Create Recipe'}
          </Button>
        </div>
      </form>
    </div>
  )
}

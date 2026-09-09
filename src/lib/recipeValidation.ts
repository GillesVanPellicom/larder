import { z } from 'zod'
import type { MetadataConfig, TagCategory } from '@/shared/types'
import { getInstructionsPlainText } from '@/lib/instructions'

export interface FormValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Validates recipe form input using Zod and dynamic metadata rules.
 */
export function validateRecipeForm(
  data: {
    title: string
    description: string
    yield_amount: string
    prep_time_minutes: number | ''
    cook_time_minutes: number | ''
    image_url: string
    source_url?: string
    ingredients: { id: string; name: string; amount?: string; unit?: string }[]
    instructions: string
    tags: Record<string, string[]>
  },
  metadataConfig: MetadataConfig | null,
  categories: TagCategory[]
): FormValidationResult {
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

  const mandatoryCategories = metadataConfig?.mandatoryCategories || []
  const errors: Record<string, string> = {}

  // 1. Zod Base Schema
  const recipeSchema = z.object({
    title: z.string().trim().min(1, { message: 'Recipe title is required.' }),
    description: z.string().trim(),
    yield_amount: z.string().trim(),
    prep_time_minutes: z.union([z.number().min(0), z.literal('')]),
    cook_time_minutes: z.union([z.number().min(0), z.literal('')]),
    image_url: z.string().trim(),
    source_url: z.string().trim().optional(),
  })

  const baseParsed = recipeSchema.safeParse({
    title: data.title,
    description: data.description,
    yield_amount: data.yield_amount,
    prep_time_minutes: data.prep_time_minutes,
    cook_time_minutes: data.cook_time_minutes,
    image_url: data.image_url,
    source_url: data.source_url,
  })

  if (!baseParsed.success) {
    for (const issue of baseParsed.error.issues) {
      const field = issue.path[0] as string
      if (!errors[field]) {
        errors[field] = issue.message
      }
    }
  }

  // 2. Dynamic Mandatory Rule Validations
  if (mandatory.image_url && !data.image_url.trim()) {
    errors.image_url = 'Image URL is required under current metadata rules.'
  }

  if (mandatory.description && !data.description.trim()) {
    errors.description = 'Description is required under current metadata rules.'
  }

  if (mandatory.yield_amount && !data.yield_amount.trim()) {
    errors.yield_amount = 'Yield is required under current metadata rules.'
  }

  if (mandatory.source_url && (!data.source_url || !data.source_url.trim())) {
    errors.source_url = 'Originally adapted from is required under current metadata rules.'
  }

  if (
    mandatory.prep_time_minutes &&
    (data.prep_time_minutes === '' || Number(data.prep_time_minutes) <= 0)
  ) {
    errors.prep_time_minutes = 'Prep time is required.'
  }

  if (
    mandatory.cook_time_minutes &&
    (data.cook_time_minutes === '' || Number(data.cook_time_minutes) <= 0)
  ) {
    errors.cook_time_minutes = 'Cook time is required.'
  }

  // 3. Ingredients Validation
  const validIngredients = data.ingredients.filter((i) => i.name.trim().length > 0)
  if (mandatory.ingredients && validIngredients.length === 0) {
    errors.ingredients = 'At least one ingredient is required.'
  }

  // 4. Instructions Validation (plain text extraction from rich HTML)
  const plainInstructions = getInstructionsPlainText(data.instructions)
  if (mandatory.instructions && !plainInstructions) {
    errors.instructions = 'Preparation instructions are required.'
  }

  // 5. Mandatory & Exclusive Tag Category Validations
  for (const catId of mandatoryCategories) {
    const assigned = data.tags[catId] || []
    if (assigned.length === 0) {
      const cat = categories.find((c) => c.id === catId)
      errors[`tags.${catId}`] = `At least one tag from "${cat?.name || catId}" is required.`
    }
  }

  for (const cat of categories) {
    if (cat.exclusive) {
      const assigned = data.tags[cat.id] || []
      if (assigned.length > 1) {
        errors[`tags.${cat.id}`] = `Category "${cat.name}" only allows 1 tag at a time.`
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

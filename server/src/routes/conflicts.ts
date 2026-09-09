import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { metadataConfigTable, recipes, tagCategories } from '../db/schema'
import type { InstructionStep, Recipe, RecipeConflict, RecipeViolation } from '../../../shared/types'

const router = Router()

// GET /api/conflicts - List all recipes currently violating metadata configuration
router.get('/', async (_req, res) => {
  try {
    // 1. Get global config
    const [configRow] = await db
      .select()
      .from(metadataConfigTable)
      .where(eq(metadataConfigTable.id, 'global'))

    const mandatory = configRow?.mandatoryFields || {
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

    const mandatoryCategories = configRow?.mandatoryCategories || []
    const timeTrackingMode = (configRow?.timeTrackingMode as string) || 'prep_and_cook'

    // 2. Get all tag categories for orphaned tags detection
    const allCategories = await db.select().from(tagCategories)
    const categoryTagMap = new Map<string, Set<string>>()
    for (const cat of allCategories) {
      categoryTagMap.set(cat.id, new Set(cat.tags || []))
    }

    // 3. Get all recipes
    const recipeRows = await db.select().from(recipes)

    const conflicts: RecipeConflict[] = []

    for (const r of recipeRows) {
      const violations: RecipeViolation[] = []

      // Mandatory field checks
      if (mandatory.title && (!r.title || !r.title.trim())) {
        violations.push({ field: 'title', message: 'Title is mandatory' })
      }

      if (mandatory.image_url && (!r.imageUrl || !r.imageUrl.trim())) {
        violations.push({ field: 'image_url', message: 'Recipe image is mandatory under current configuration' })
      }

      if (mandatory.description && (!r.description || !r.description.trim())) {
        violations.push({ field: 'description', message: 'Description is mandatory' })
      }

      if (mandatory.yield_amount && (!r.yieldAmount || r.yieldAmount <= 0)) {
        violations.push({ field: 'yield_amount', message: 'Yield is mandatory' })
      }

      if (timeTrackingMode !== 'no_cook') {
        if (timeTrackingMode === 'total_only') {
          if (
            mandatory.prep_time_minutes &&
            (!r.prepTimeMinutes || r.prepTimeMinutes <= 0) &&
            (!r.totalTimeMinutes || r.totalTimeMinutes <= 0)
          ) {
            violations.push({ field: 'prep_time_minutes', message: 'Total time is mandatory' })
          }
        } else if (timeTrackingMode === 'prep_and_cook') {
          if (mandatory.prep_time_minutes && (!r.prepTimeMinutes || r.prepTimeMinutes <= 0)) {
            violations.push({ field: 'prep_time_minutes', message: 'Preparation time is mandatory' })
          }

          if (mandatory.cook_time_minutes && (!r.cookTimeMinutes || r.cookTimeMinutes <= 0)) {
            violations.push({ field: 'cook_time_minutes', message: 'Cooking time is mandatory' })
          }
        }
      }

      if (mandatory.ingredients && (!r.ingredients || r.ingredients.length === 0)) {
        violations.push({ field: 'ingredients', message: 'At least one ingredient is required' })
      }

      if (mandatory.instructions) {
        const instr = r.instructions
        if (!instr) {
          violations.push({ field: 'instructions', message: 'Instructions are required under current metadata rules' })
        } else if (typeof instr === 'string') {
          const textOnly = instr.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
          if (!textOnly) {
            violations.push({ field: 'instructions', message: 'Instructions are required under current metadata rules' })
          }
        } else if (Array.isArray(instr) && instr.length === 0) {
          violations.push({ field: 'instructions', message: 'Instructions are required under current metadata rules' })
        }
      }

      // Mandatory tag category checks
      for (const catId of mandatoryCategories) {
        const catTags = r.tags?.[catId]
        if (!Array.isArray(catTags) || catTags.length === 0) {
          const catName = allCategories.find((c) => c.id === catId)?.name || catId
          violations.push({
            field: `tags.${catId}`,
            message: `Must have at least one tag in category "${catName}"`,
          })
        }
      }

      // Exclusive tag category checks (only 1 tag allowed)
      for (const cat of allCategories) {
        if (cat.exclusive) {
          const catTags = r.tags?.[cat.id]
          if (Array.isArray(catTags) && catTags.length > 1) {
            violations.push({
              field: `tags.${cat.id}`,
              message: `Category "${cat.name}" is exclusive (single tag only), but recipe has ${catTags.length} tags: ${catTags.join(', ')}`,
            })
          }
        }
      }

      if (violations.length > 0) {
        let ingredients = r.ingredients || []
        if (typeof (ingredients as unknown) === 'string') {
          try {
            ingredients = JSON.parse(ingredients as unknown as string)
          } catch {
            ingredients = (ingredients as unknown as string)
              .split(',')
              .map((name, i) => ({ id: String(i + 1), name: name.trim() }))
          }
        }

        let instructions: string | InstructionStep[] = r.instructions || ''
        if (typeof (instructions as unknown) === 'string') {
          try {
            const parsed = JSON.parse(instructions as unknown as string)
            if (typeof parsed === 'string' || Array.isArray(parsed)) {
              instructions = parsed
            }
          } catch {
            // HTML or plain text string
          }
        }

        const formattedRecipe: Recipe = {
          id: r.id,
          title: r.title,
          description: r.description,
          yield_amount: r.yieldAmount,
          yield_unit: r.yieldUnit || 'servings',
          prep_time_minutes: r.prepTimeMinutes,
          cook_time_minutes: r.cookTimeMinutes,
          total_time_minutes: r.totalTimeMinutes,
          image_url: r.imageUrl,
          source_url: r.sourceUrl,
          ingredients,
          instructions,
          tags: r.tags || {},
          created_at: r.createdAt.toISOString(),
          updated_at: r.updatedAt.toISOString(),
        }

        conflicts.push({
          recipe: formattedRecipe,
          violations,
        })
      }
    }

    res.json({
      totalConflicts: conflicts.length,
      conflicts,
    })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to get conflicts:', err)
    res.status(500).json({ error: 'Failed to analyze metadata conflicts', details })
  }
})

export default router

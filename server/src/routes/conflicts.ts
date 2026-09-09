import { Router } from 'express'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../db'
import { recipes } from '../db/schema'
import type { InstructionStep, Recipe, RecipeConflict } from '../../../shared/types'

const router = Router()

// GET /api/conflicts - List all recipes currently violating metadata configuration
router.get('/', async (_req, res) => {
  try {
    const violationRows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.hasViolations, true), isNull(recipes.deletedAt)))

    const conflicts: RecipeConflict[] = violationRows.map((r) => {
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
        has_violations: r.hasViolations,
        violations: r.violations,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      }

      return {
        recipe: formattedRecipe,
        violations: r.violations || [],
      }
    })

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

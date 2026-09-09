import { Router } from 'express'
import { eq, and, isNull } from 'drizzle-orm'
import { db } from '../db'
import { recipes } from '../db/schema'
import { attachIngredientsToRecipes } from '../services/recipeQueryService'
import type { RecipeConflict } from '../../../shared/types'

const router = Router()

// GET /api/conflicts - List all recipes currently violating metadata configuration
router.get('/', async (_req, res) => {
  try {
    const violationRows = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.hasViolations, true), isNull(recipes.deletedAt)))

    const formattedRecipes = await attachIngredientsToRecipes(violationRows)

    const conflicts: RecipeConflict[] = formattedRecipes.map((recipe) => ({
      recipe,
      violations: recipe.violations || [],
    }))

    res.json({
      totalConflicts: conflicts.length,
      conflicts,
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

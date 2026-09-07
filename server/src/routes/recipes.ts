import { Router } from 'express'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { recipes } from '../db/schema'
import type { CreateRecipeDTO, InstructionStep, Recipe } from '../../../shared/types'

const router = Router()

function formatRecipe(r: typeof recipes.$inferSelect): Recipe {
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

  return {
    id: r.id,
    title: r.title,
    description: r.description,
    yield_amount: r.yieldAmount,
    prep_time_minutes: r.prepTimeMinutes,
    cook_time_minutes: r.cookTimeMinutes,
    total_time_minutes: r.totalTimeMinutes,
    image_url: r.imageUrl,
    source_url: r.sourceUrl,
    notes: r.notes,
    ingredients,
    instructions,
    tags: r.tags || {},
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

// GET /api/recipes
router.get('/', async (_req, res) => {
  try {
    const rows = await db.select().from(recipes).orderBy(desc(recipes.id))
    res.json(rows.map(formatRecipe))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch recipes:', err)
    res.status(500).json({ error: 'Failed to fetch recipes from database', details })
  }
})

// GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const [row] = await db.select().from(recipes).where(eq(recipes.id, id))
    if (!row) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    res.json(formatRecipe(row))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch recipe:', err)
    res.status(500).json({ error: 'Failed to fetch recipe', details })
  }
})

// POST /api/recipes
router.post('/', async (req, res) => {
  try {
    const body = req.body as CreateRecipeDTO

    if (!body.title || !body.title.trim()) {
      return res.status(400).json({ error: 'Recipe title is required' })
    }

    const prep = Number(body.prep_time_minutes) || 0
    const cook = Number(body.cook_time_minutes) || 0
    const total = Number(body.total_time_minutes) || (prep + cook)

    const [created] = await db
      .insert(recipes)
      .values({
        title: body.title.trim(),
        description: body.description ? body.description.trim() : '',
        yieldAmount: body.yield_amount ? body.yield_amount.trim() : '',
        prepTimeMinutes: prep,
        cookTimeMinutes: cook,
        totalTimeMinutes: total,
        imageUrl: body.image_url ? body.image_url.trim() : '',
        sourceUrl: body.source_url ? body.source_url.trim() : '',
        notes: body.notes ? body.notes.trim() : '',
        ingredients: body.ingredients || [],
        instructions: body.instructions !== undefined ? body.instructions : '',
        tags: body.tags || {},
      })
      .returning()

    res.status(201).json(formatRecipe(created))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to create recipe:', err)
    res.status(500).json({ error: 'Failed to create recipe', details })
  }
})

// PUT /api/recipes/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const body = req.body as Partial<CreateRecipeDTO>
    const prep = body.prep_time_minutes !== undefined ? Number(body.prep_time_minutes) : undefined
    const cook = body.cook_time_minutes !== undefined ? Number(body.cook_time_minutes) : undefined
    const total = body.total_time_minutes !== undefined
      ? Number(body.total_time_minutes)
      : (prep !== undefined && cook !== undefined ? prep + cook : undefined)

    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (body.title !== undefined) updatePayload.title = body.title.trim()
    if (body.description !== undefined) updatePayload.description = body.description.trim()
    if (body.yield_amount !== undefined) updatePayload.yieldAmount = body.yield_amount.trim()
    if (prep !== undefined) updatePayload.prepTimeMinutes = prep
    if (cook !== undefined) updatePayload.cookTimeMinutes = cook
    if (total !== undefined) updatePayload.totalTimeMinutes = total
    if (body.image_url !== undefined) updatePayload.imageUrl = body.image_url.trim()
    if (body.source_url !== undefined) updatePayload.sourceUrl = body.source_url.trim()
    if (body.notes !== undefined) updatePayload.notes = body.notes.trim()
    if (body.ingredients !== undefined) updatePayload.ingredients = body.ingredients
    if (body.instructions !== undefined) updatePayload.instructions = body.instructions
    if (body.tags !== undefined) updatePayload.tags = body.tags

    const [updated] = await db
      .update(recipes)
      .set(updatePayload)
      .where(eq(recipes.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    res.json(formatRecipe(updated))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to update recipe:', err)
    res.status(500).json({ error: 'Failed to update recipe', details })
  }
})

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const [deleted] = await db
      .delete(recipes)
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id })

    if (!deleted) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    res.json({ success: true, id: deleted.id })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to delete recipe:', err)
    res.status(500).json({ error: 'Failed to delete recipe', details })
  }
})

export default router

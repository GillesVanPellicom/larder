import { Router } from 'express'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { recipeHistory, recipes } from '../db/schema'
import type {
  CreateRecipeDTO,
  IngredientItem,
  InstructionStep,
  Recipe,
  RecipeTags,
} from '../../../shared/types'

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
    template_id: r.templateId || 'tpl_default',
    template_version_id: r.templateVersionId || 1,
    field_values: r.fieldValues || {},
    archived_values: r.archivedValues || {},
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

// GET /api/recipes
router.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(recipes)
      .where(isNull(recipes.deletedAt))
      .orderBy(desc(recipes.id))
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

    const [row] = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.id, id), isNull(recipes.deletedAt)))
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

// Helper to extract top-level search columns from field_values
function syncCoreColumnsFromFieldValues(
  body: Partial<CreateRecipeDTO> & { field_values?: Record<string, unknown> }
) {
  const fv = body.field_values || {}
  const title = body.title !== undefined ? body.title : ((fv.fld_title as string) || '')
  const description = body.description !== undefined ? body.description : ((fv.fld_description as string) || '')
  const yieldAmount = body.yield_amount !== undefined ? body.yield_amount : ((fv.fld_yield as string) || '')
  const prep = body.prep_time_minutes !== undefined ? Number(body.prep_time_minutes) : (Number(fv.fld_prep_time) || 0)
  const cook = body.cook_time_minutes !== undefined ? Number(body.cook_time_minutes) : (Number(fv.fld_cook_time) || 0)
  const total = body.total_time_minutes !== undefined ? Number(body.total_time_minutes) : (Number(fv.fld_total_time) || (prep + cook))
  const imageUrl = body.image_url !== undefined ? body.image_url : ((fv.fld_image as string) || '')
  const sourceUrl = body.source_url || ''
  const notes = body.notes !== undefined ? body.notes : ((fv.fld_notes as string) || '')
  const ingredients =
    body.ingredients !== undefined
      ? body.ingredients
      : (fv.fld_ingredients as unknown as IngredientItem[]) || []
  const instructions =
    body.instructions !== undefined
      ? body.instructions
      : (fv.fld_instructions as unknown as string | InstructionStep[]) || ''
  const tags =
    body.tags !== undefined
      ? body.tags
      : (fv.fld_tags as unknown as RecipeTags) || {}

  return {
    title: String(title).trim(),
    description: String(description).trim(),
    yieldAmount: String(yieldAmount).trim(),
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    totalTimeMinutes: total,
    imageUrl: String(imageUrl).trim(),
    sourceUrl: String(sourceUrl).trim(),
    notes: String(notes).trim(),
    ingredients,
    instructions,
    tags,
    templateId: body.template_id || 'tpl_default',
    templateVersionId: body.template_version_id || 1,
    fieldValues: {
      ...fv,
      fld_title: title,
      fld_description: description,
      fld_yield: yieldAmount,
      fld_prep_time: prep,
      fld_cook_time: cook,
      fld_total_time: total,
      fld_image: imageUrl,
      fld_notes: notes,
      fld_ingredients: ingredients,
      fld_instructions: instructions,
      fld_tags: tags,
    },
    archivedValues: body.archived_values || {},
  }
}

// POST /api/recipes
router.post('/', async (req, res) => {
  try {
    const body = req.body as CreateRecipeDTO

    const synced = syncCoreColumnsFromFieldValues(body)

    if (!synced.title) {
      return res.status(400).json({ error: 'Recipe title is required' })
    }

    const [created] = await db
      .insert(recipes)
      .values(synced)
      .returning()

    // Save historical snapshot
    await db.insert(recipeHistory).values({
      recipeId: created.id,
      templateVersionId: created.templateVersionId,
      snapshot: {
        title: created.title,
        fieldValues: created.fieldValues,
        archivedValues: created.archivedValues,
      },
    })

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
    const synced = syncCoreColumnsFromFieldValues(body)

    const updatePayload: Record<string, unknown> = {
      ...synced,
      updatedAt: new Date(),
    }

    const [updated] = await db
      .update(recipes)
      .set(updatePayload)
      .where(eq(recipes.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // Save historical snapshot
    await db.insert(recipeHistory).values({
      recipeId: updated.id,
      templateVersionId: updated.templateVersionId,
      snapshot: {
        title: updated.title,
        fieldValues: updated.fieldValues,
        archivedValues: updated.archivedValues,
      },
    })

    res.json(formatRecipe(updated))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to update recipe:', err)
    res.status(500).json({ error: 'Failed to update recipe', details })
  }
})

// GET /api/recipes/:id/history - Get revision history snapshots
router.get('/:id/history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    const historyRows = await db
      .select()
      .from(recipeHistory)
      .where(eq(recipeHistory.recipeId, id))
      .orderBy(desc(recipeHistory.savedAt))

    res.json(
      historyRows.map((h) => ({
        id: h.id,
        recipeId: h.recipeId,
        templateVersionId: h.templateVersionId,
        snapshot: h.snapshot,
        savedAt: h.savedAt.toISOString(),
      }))
    )
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch recipe history:', err)
    res.status(500).json({ error: 'Failed to fetch recipe history', details })
  }
})

// POST /api/recipes/:id/restore-version/:historyId - Restore historical snapshot
router.post('/:id/restore-version/:historyId', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    const historyId = parseInt(req.params.historyId, 10)
    if (isNaN(id) || isNaN(historyId)) {
      return res.status(400).json({ error: 'Invalid recipe or history ID' })
    }

    const [historyEntry] = await db
      .select()
      .from(recipeHistory)
      .where(and(eq(recipeHistory.id, historyId), eq(recipeHistory.recipeId, id)))

    if (!historyEntry) {
      return res.status(404).json({ error: 'History snapshot not found' })
    }

    const snapshot = historyEntry.snapshot as {
      title: string
      fieldValues: Record<string, unknown>
      archivedValues: Record<string, unknown>
    }

    const synced = syncCoreColumnsFromFieldValues({
      field_values: snapshot.fieldValues,
      archived_values: snapshot.archivedValues,
      title: snapshot.title,
      template_version_id: historyEntry.templateVersionId,
    })

    const [restored] = await db
      .update(recipes)
      .set({
        ...synced,
        updatedAt: new Date(),
      })
      .where(eq(recipes.id, id))
      .returning()

    // Add another snapshot recording the restore event
    await db.insert(recipeHistory).values({
      recipeId: restored.id,
      templateVersionId: restored.templateVersionId,
      snapshot: {
        title: restored.title,
        fieldValues: restored.fieldValues,
        archivedValues: restored.archivedValues,
        restoredFromHistoryId: historyId,
      },
    })

    res.json(formatRecipe(restored))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to restore recipe history version:', err)
    res.status(500).json({ error: 'Failed to restore recipe version', details })
  }
})

// DELETE /api/recipes/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' })
    }

    // Soft delete for safety
    const [deleted] = await db
      .update(recipes)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
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

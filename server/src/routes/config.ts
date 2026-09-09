import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { metadataConfigTable } from '../db/schema'
import type { MetadataConfig, TimeTrackingMode } from '../../../shared/types'

const router = Router()

// GET /api/config
router.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(metadataConfigTable)
      .where(eq(metadataConfigTable.id, 'global'))

    if (rows.length === 0) {
      const defaultConfig: MetadataConfig = {
        mandatoryFields: {
          title: true,
          ingredients: true,
          instructions: true,
          image_url: false,
          description: false,
          yield_amount: false,
          prep_time_minutes: false,
          cook_time_minutes: false,
          source_url: false,
        },
        mandatoryCategories: [],
        timeTrackingMode: 'prep_and_cook',
      }
      return res.json(defaultConfig)
    }

    const row = rows[0]
    const config: MetadataConfig = {
      mandatoryFields: row.mandatoryFields,
      mandatoryCategories: row.mandatoryCategories,
      timeTrackingMode: (row.timeTrackingMode as TimeTrackingMode) || 'prep_and_cook',
      updated_at: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    }

    res.json(config)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to get metadata config:', err)
    res.status(500).json({ error: 'Failed to retrieve metadata config', details })
  }
})

// PUT /api/config
router.put('/', async (req, res) => {
  try {
    const { mandatoryFields, mandatoryCategories, timeTrackingMode } = req.body as Partial<MetadataConfig>

    if (!mandatoryFields) {
      return res.status(400).json({ error: 'mandatoryFields is required' })
    }

    // Baseline required fields
    mandatoryFields.title = true
    mandatoryFields.ingredients = true
    mandatoryFields.instructions = true

    if (timeTrackingMode === 'no_cook') {
      mandatoryFields.prep_time_minutes = false
      mandatoryFields.cook_time_minutes = false
    } else if (timeTrackingMode === 'total_only') {
      mandatoryFields.cook_time_minutes = false
    }

    const [updated] = await db
      .insert(metadataConfigTable)
      .values({
        id: 'global',
        mandatoryFields,
        mandatoryCategories: mandatoryCategories || [],
        timeTrackingMode: timeTrackingMode || 'prep_and_cook',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: metadataConfigTable.id,
        set: {
          mandatoryFields,
          mandatoryCategories: mandatoryCategories || [],
          timeTrackingMode: timeTrackingMode || 'prep_and_cook',
          updatedAt: new Date(),
        },
      })
      .returning()

    // Recalculate stored violations across all recipes
    const { recipeViolationService } = await import('../services/recipeViolationService')
    await recipeViolationService.recalculateAllViolations()

    res.json({
      mandatoryFields: updated.mandatoryFields,
      mandatoryCategories: updated.mandatoryCategories,
      timeTrackingMode: updated.timeTrackingMode,
      updated_at: updated.updatedAt.toISOString(),
    })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to update metadata config:', err)
    res.status(500).json({ error: 'Failed to update metadata config', details })
  }
})

export default router

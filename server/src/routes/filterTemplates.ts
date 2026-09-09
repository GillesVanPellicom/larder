import { Router } from 'express'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { filterTemplates } from '../db/schema'
import type { FilterTemplate } from '../../../shared/types'

const router = Router()

// GET /api/filter-templates - Retrieve all saved filter templates
router.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(filterTemplates)
      .orderBy(
        sql`${filterTemplates.lastUsedAt} DESC NULLS LAST`,
        desc(filterTemplates.createdAt)
      )

    const result: FilterTemplate[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      criteria: r.criteria,
      use_count: r.useCount,
      last_used_at: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    }))

    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to fetch filter templates:', err)
    res.status(500).json({ error: 'Failed to retrieve filter templates', details })
  }
})

// POST /api/filter-templates - Create a new filter template
router.post('/', async (req, res) => {
  try {
    const { name, criteria } = req.body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' })
    }

    if (!criteria || typeof criteria !== 'object') {
      return res.status(400).json({ error: 'Valid filter criteria is required' })
    }

    const [created] = await db
      .insert(filterTemplates)
      .values({
        name: name.trim(),
        criteria,
        useCount: 0,
      })
      .returning()

    const result: FilterTemplate = {
      id: created.id,
      name: created.name,
      criteria: created.criteria,
      use_count: created.useCount,
      last_used_at: created.lastUsedAt ? created.lastUsedAt.toISOString() : null,
      created_at: created.createdAt.toISOString(),
      updated_at: created.updatedAt.toISOString(),
    }

    res.status(201).json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('[API ERROR] Failed to create filter template:', err)
    res.status(500).json({ error: 'Failed to create filter template', details })
  }
})

// PUT /api/filter-templates/:id - Update an existing filter template (rename or overwrite criteria)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' })
    }

    const { name, criteria } = req.body
    const updateValues: Partial<typeof filterTemplates.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Template name cannot be empty' })
      }
      updateValues.name = name.trim()
    }

    if (criteria !== undefined) {
      if (!criteria || typeof criteria !== 'object') {
        return res.status(400).json({ error: 'Valid filter criteria is required' })
      }
      updateValues.criteria = criteria
    }

    const [updated] = await db
      .update(filterTemplates)
      .set(updateValues)
      .where(eq(filterTemplates.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Filter template not found' })
    }

    const result: FilterTemplate = {
      id: updated.id,
      name: updated.name,
      criteria: updated.criteria,
      use_count: updated.useCount,
      last_used_at: updated.lastUsedAt ? updated.lastUsedAt.toISOString() : null,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    }

    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error(`[API ERROR] Failed to update filter template ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to update filter template', details })
  }
})

// POST /api/filter-templates/:id/apply - Record template usage
router.post('/:id/apply', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' })
    }

    const [updated] = await db
      .update(filterTemplates)
      .set({
        useCount: sql`${filterTemplates.useCount} + 1`,
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(filterTemplates.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Filter template not found' })
    }

    const result: FilterTemplate = {
      id: updated.id,
      name: updated.name,
      criteria: updated.criteria,
      use_count: updated.useCount,
      last_used_at: updated.lastUsedAt ? updated.lastUsedAt.toISOString() : null,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
    }

    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error(`[API ERROR] Failed to apply filter template ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to apply filter template', details })
  }
})

// DELETE /api/filter-templates/:id - Delete a filter template
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' })
    }

    const [deleted] = await db
      .delete(filterTemplates)
      .where(eq(filterTemplates.id, id))
      .returning()

    if (!deleted) {
      return res.status(404).json({ error: 'Filter template not found' })
    }

    res.status(204).end()
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error(`[API ERROR] Failed to delete filter template ${req.params.id}:`, err)
    res.status(500).json({ error: 'Failed to delete filter template', details })
  }
})

export default router

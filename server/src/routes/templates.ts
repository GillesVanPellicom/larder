import { Router } from 'express'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db, pool } from '../db'
import { templates, templateVersions } from '../db/schema'
import type {
  CardGridLayoutConfig,
  RecipeTemplate,
  TemplateField,
} from '../../../shared/types'

const router = Router()

// Helper to format a template with its current version
function formatTemplate(
  t: typeof templates.$inferSelect,
  v?: typeof templateVersions.$inferSelect,
  allVersions?: (typeof templateVersions.$inferSelect)[]
): RecipeTemplate {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    isDefault: t.isDefault,
    currentVersionId: t.currentVersionId,
    currentVersion: v
      ? {
          id: v.id,
          templateId: v.templateId,
          version: v.version,
          changeSummary: v.changeSummary,
          fieldsSchema: v.fieldsSchema,
          cardLayout: v.cardLayout,
          createdAt: v.createdAt.toISOString(),
        }
      : undefined,
    versions: allVersions?.map((ver) => ({
      id: ver.id,
      templateId: ver.templateId,
      version: ver.version,
      changeSummary: ver.changeSummary,
      fieldsSchema: ver.fieldsSchema,
      cardLayout: ver.cardLayout,
      createdAt: ver.createdAt.toISOString(),
    })),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }
}

// GET /api/templates - List all non-deleted templates with their current version
router.get('/', async (_req, res) => {
  try {
    const templateRows = await db
      .select()
      .from(templates)
      .where(isNull(templates.deletedAt))
      .orderBy(desc(templates.isDefault), desc(templates.createdAt))

    const versionRows = await db.select().from(templateVersions)

    const versionMap = new Map<number, typeof templateVersions.$inferSelect>()
    for (const v of versionRows) {
      versionMap.set(v.id, v)
    }

    const result = templateRows.map((t) =>
      formatTemplate(t, versionMap.get(t.currentVersionId))
    )

    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch templates:', err)
    res.status(500).json({ error: 'Failed to fetch templates', details })
  }
})

// GET /api/templates/:id - Get template with full version history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [templateRow] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), isNull(templates.deletedAt)))

    if (!templateRow) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const allVersions = await db
      .select()
      .from(templateVersions)
      .where(eq(templateVersions.templateId, id))
      .orderBy(desc(templateVersions.version))

    const currentVersion = allVersions.find((v) => v.id === templateRow.currentVersionId) || allVersions[0]

    res.json(formatTemplate(templateRow, currentVersion, allVersions))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch template detail:', err)
    res.status(500).json({ error: 'Failed to fetch template', details })
  }
})

// POST /api/templates/:id/check-field-usage - Check if fields are in use by recipes
router.post('/:id/check-field-usage', async (req, res) => {
  try {
    const { id } = req.params
    const { fieldIds } = req.body as { fieldIds: string[] }

    if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
      return res.json([])
    }

    const reports = []
    for (const fieldId of fieldIds) {
      const result = await pool.query(
        `SELECT id, title FROM recipes 
         WHERE template_id = $1 
           AND deleted_at IS NULL
           AND field_values ? $2 
           AND (field_values->>$2) IS NOT NULL 
           AND (field_values->>$2) != '' 
           AND (field_values->>$2) != '[]' 
           AND (field_values->>$2) != '{}'
         LIMIT 10`,
        [id, fieldId]
      )

      const countResult = await pool.query(
        `SELECT COUNT(*)::int as count FROM recipes 
         WHERE template_id = $1 
           AND deleted_at IS NULL
           AND field_values ? $2 
           AND (field_values->>$2) IS NOT NULL 
           AND (field_values->>$2) != '' 
           AND (field_values->>$2) != '[]' 
           AND (field_values->>$2) != '{}'`,
        [id, fieldId]
      )

      const usedByCount = countResult.rows[0]?.count || 0
      reports.push({
        fieldId,
        inUse: usedByCount > 0,
        usedByCount,
        recipeTitles: result.rows.map((r: { title: string }) => r.title),
      })
    }

    res.json(reports)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to check field usage:', err)
    res.status(500).json({ error: 'Failed to check field usage', details })
  }
})

// POST /api/templates - Create a new template with initial version 1
router.post('/', async (req, res) => {
  try {
    const body = req.body as {
      name: string
      description?: string
      fieldsSchema: TemplateField[]
      cardLayout: CardGridLayoutConfig
      isDefault?: boolean
    }

    if (!body.name || !body.name.trim()) {
      return res.status(400).json({ error: 'Template name is required' })
    }

    const templateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // If marked default, unset existing default
    if (body.isDefault) {
      await db.update(templates).set({ isDefault: false }).where(eq(templates.isDefault, true))
    }

    const [createdVersion] = await db
      .insert(templateVersions)
      .values({
        templateId,
        version: 1,
        changeSummary: 'Initial version',
        fieldsSchema: body.fieldsSchema || [],
        cardLayout: body.cardLayout || { columns: 4, widgets: [] },
      })
      .returning()

    const [createdTemplate] = await db
      .insert(templates)
      .values({
        id: templateId,
        name: body.name.trim(),
        description: body.description ? body.description.trim() : '',
        isDefault: Boolean(body.isDefault),
        currentVersionId: createdVersion.id,
      })
      .returning()

    res.status(201).json(formatTemplate(createdTemplate, createdVersion, [createdVersion]))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to create template:', err)
    res.status(500).json({ error: 'Failed to create template', details })
  }
})

// PUT /api/templates/:id - Update template (Publishes a new version)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const body = req.body as {
      name?: string
      description?: string
      isDefault?: boolean
      changeSummary?: string
      fieldsSchema: TemplateField[]
      cardLayout: CardGridLayoutConfig
      archiveRemovedFields?: boolean
      confirmPurgeRemovedFields?: boolean
    }

    const [existing] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), isNull(templates.deletedAt)))

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' })
    }

    // Get current version to inspect removed fields
    const [latestVersion] = await db
      .select()
      .from(templateVersions)
      .where(eq(templateVersions.id, existing.currentVersionId))

    const prevFields: TemplateField[] = latestVersion?.fieldsSchema || []
    const newFields: TemplateField[] = body.fieldsSchema || []

    const prevFieldIds = new Set(prevFields.map((f) => f.id))
    const newFieldIds = new Set(newFields.map((f) => f.id))
    const removedFieldIds = [...prevFieldIds].filter((fid) => !newFieldIds.has(fid))

    // Pre-flight check: If fields were removed, check if any recipes use them
    if (removedFieldIds.length > 0 && !body.archiveRemovedFields && !body.confirmPurgeRemovedFields) {
      const inUseFields = []
      for (const fid of removedFieldIds) {
        const countRes = await pool.query(
          `SELECT COUNT(*)::int as count FROM recipes 
           WHERE template_id = $1 
             AND deleted_at IS NULL
             AND field_values ? $2 
             AND (field_values->>$2) IS NOT NULL 
             AND (field_values->>$2) != '' 
             AND (field_values->>$2) != '[]' 
             AND (field_values->>$2) != '{}'`,
          [id, fid]
        )
        const count = countRes.rows[0]?.count || 0
        if (count > 0) {
          const sampleRes = await pool.query(
            `SELECT title FROM recipes 
             WHERE template_id = $1 
               AND deleted_at IS NULL
               AND field_values ? $2 
             LIMIT 5`,
            [id, fid]
          )
          const fieldDef = prevFields.find((f) => f.id === fid)
          inUseFields.push({
            fieldId: fid,
            name: fieldDef?.name || fid,
            usedByCount: count,
            recipeTitles: sampleRes.rows.map((r: { title: string }) => r.title),
          })
        }
      }

      if (inUseFields.length > 0) {
        return res.status(409).json({
          error: 'Removed fields contain data in existing recipes',
          requiresResolution: true,
          inUseFields,
        })
      }
    }

    let finalFieldsSchema = newFields
    if (body.archiveRemovedFields && removedFieldIds.length > 0) {
      const archivedFields = prevFields
        .filter((f) => removedFieldIds.includes(f.id))
        .map((f) => ({ ...f, isArchived: true }))
      finalFieldsSchema = [...newFields, ...archivedFields]
    }

    const allVersions = await db
      .select({ version: templateVersions.version })
      .from(templateVersions)
      .where(eq(templateVersions.templateId, id))

    const nextVersionNumber = Math.max(...allVersions.map((v) => v.version), 0) + 1

    if (body.isDefault) {
      await db.update(templates).set({ isDefault: false }).where(eq(templates.isDefault, true))
    }

    const [newVersionRow] = await db
      .insert(templateVersions)
      .values({
        templateId: id,
        version: nextVersionNumber,
        changeSummary: body.changeSummary?.trim() || `Updated to version ${nextVersionNumber}`,
        fieldsSchema: finalFieldsSchema,
        cardLayout: body.cardLayout || latestVersion?.cardLayout || { columns: 4, widgets: [] },
      })
      .returning()

    const updatePayload: Record<string, unknown> = {
      currentVersionId: newVersionRow.id,
      updatedAt: new Date(),
    }
    if (body.name !== undefined) updatePayload.name = body.name.trim()
    if (body.description !== undefined) updatePayload.description = body.description.trim()
    if (body.isDefault !== undefined) updatePayload.isDefault = Boolean(body.isDefault)

    const [updatedTemplate] = await db
      .update(templates)
      .set(updatePayload)
      .where(eq(templates.id, id))
      .returning()

    if (body.confirmPurgeRemovedFields && removedFieldIds.length > 0) {
      for (const fid of removedFieldIds) {
        await pool.query(
          `UPDATE recipes 
           SET archived_values = archived_values || jsonb_build_object($2, field_values->$2),
               field_values = field_values - $2
           WHERE template_id = $1 AND field_values ? $2`,
          [id, fid]
        )
      }
    }

    res.json(formatTemplate(updatedTemplate, newVersionRow))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to update template:', err)
    res.status(500).json({ error: 'Failed to update template', details })
  }
})

// POST /api/templates/:id/rollback - Rollback template to a specific past version
router.post('/:id/rollback', async (req, res) => {
  try {
    const { id } = req.params
    const { targetVersionId } = req.body as { targetVersionId: number }

    const [templateRow] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), isNull(templates.deletedAt)))

    if (!templateRow) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const [targetVersion] = await db
      .select()
      .from(templateVersions)
      .where(and(eq(templateVersions.id, targetVersionId), eq(templateVersions.templateId, id)))

    if (!targetVersion) {
      return res.status(404).json({ error: 'Target version not found' })
    }

    const allVersions = await db
      .select({ version: templateVersions.version })
      .from(templateVersions)
      .where(eq(templateVersions.templateId, id))

    const nextVersionNumber = Math.max(...allVersions.map((v) => v.version), 0) + 1

    const [rollbackVersion] = await db
      .insert(templateVersions)
      .values({
        templateId: id,
        version: nextVersionNumber,
        changeSummary: `Rolled back to v${targetVersion.version}`,
        fieldsSchema: targetVersion.fieldsSchema,
        cardLayout: targetVersion.cardLayout,
      })
      .returning()

    const [updatedTemplate] = await db
      .update(templates)
      .set({
        currentVersionId: rollbackVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, id))
      .returning()

    res.json(formatTemplate(updatedTemplate, rollbackVersion))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to rollback template:', err)
    res.status(500).json({ error: 'Failed to rollback template', details })
  }
})

// POST /api/templates/:id/duplicate - Clone template
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params
    const [sourceTemplate] = await db
      .select()
      .from(templates)
      .where(and(eq(templates.id, id), isNull(templates.deletedAt)))

    if (!sourceTemplate) {
      return res.status(404).json({ error: 'Source template not found' })
    }

    const [sourceVersion] = await db
      .select()
      .from(templateVersions)
      .where(eq(templateVersions.id, sourceTemplate.currentVersionId))

    const newTemplateId = `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    const [newVersion] = await db
      .insert(templateVersions)
      .values({
        templateId: newTemplateId,
        version: 1,
        changeSummary: `Cloned from ${sourceTemplate.name}`,
        fieldsSchema: sourceVersion?.fieldsSchema || [],
        cardLayout: sourceVersion?.cardLayout || { columns: 4, widgets: [] },
      })
      .returning()

    const [newTemplate] = await db
      .insert(templates)
      .values({
        id: newTemplateId,
        name: `${sourceTemplate.name} (Copy)`,
        description: sourceTemplate.description,
        isDefault: false,
        currentVersionId: newVersion.id,
      })
      .returning()

    res.status(201).json(formatTemplate(newTemplate, newVersion, [newVersion]))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to duplicate template:', err)
    res.status(500).json({ error: 'Failed to duplicate template', details })
  }
})

// DELETE /api/templates/:id - Soft delete template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (id === 'tpl_default') {
      return res.status(400).json({ error: 'The default template cannot be deleted.' })
    }

    await pool.query(
      `UPDATE recipes 
       SET template_id = 'tpl_default', template_version_id = 1 
       WHERE template_id = $1`,
      [id]
    )

    await db
      .update(templates)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(templates.id, id))

    res.json({ success: true, message: 'Template removed successfully' })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to delete template:', err)
    res.status(500).json({ error: 'Failed to delete template', details })
  }
})

export default router

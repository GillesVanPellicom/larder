import { z } from 'zod'
import { desc, eq, sql } from 'drizzle-orm'
import { publicProcedure, router } from '../trpc'
import { db } from '../../db'
import { filterTemplates } from '../../db/schema'
import type { FilterCriteria, FilterTemplate } from '../../../../shared/types'

const filterCriteriaSchema = z.object({
  searchQuery: z.string().default(''),
  matchModePerElement: z.object({
    ingredients: z.enum(['any', 'all', 'none']).default('any'),
    tags: z.enum(['any', 'all', 'none']).default('any'),
    categoryTags: z.record(z.string(), z.enum(['any', 'all', 'none'])).default({}),
  }),
  selectedIngredients: z.array(z.string()).default([]),
  selectedTags: z.record(z.string(), z.array(z.string())).default({}),
  maxTotalTime: z.number().optional(),
  maxPrepTime: z.number().optional(),
  maxCookTime: z.number().optional(),
  hasImage: z.union([z.enum(['any', 'none', 'only']), z.boolean(), z.null()]).optional(),
  onlyConflicts: z.union([z.enum(['any', 'none', 'only']), z.boolean()]).optional(),
})

export const filterTemplatesRouter = router({
  list: publicProcedure.query(async (): Promise<FilterTemplate[]> => {
    const rows = await db
      .select()
      .from(filterTemplates)
      .orderBy(
        sql`${filterTemplates.lastUsedAt} DESC NULLS LAST`,
        desc(filterTemplates.createdAt)
      )

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      criteria: r.criteria as FilterCriteria,
      use_count: r.useCount,
      last_used_at: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    }))
  }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, 'Template name is required'),
        criteria: filterCriteriaSchema,
      })
    )
    .mutation(async ({ input }): Promise<FilterTemplate> => {
      const [created] = await db
        .insert(filterTemplates)
        .values({
          name: input.name.trim(),
          criteria: input.criteria,
          useCount: 0,
        })
        .returning()

      return {
        id: created.id,
        name: created.name,
        criteria: created.criteria as FilterCriteria,
        use_count: created.useCount,
        last_used_at: created.lastUsedAt ? created.lastUsedAt.toISOString() : null,
        created_at: created.createdAt.toISOString(),
        updated_at: created.updatedAt.toISOString(),
      }
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          name: z.string().min(1).optional(),
          criteria: filterCriteriaSchema.optional(),
        }),
      })
    )
    .mutation(async ({ input }): Promise<FilterTemplate> => {
      const updateValues: Partial<typeof filterTemplates.$inferInsert> = {
        updatedAt: new Date(),
      }

      if (input.data.name !== undefined) {
        updateValues.name = input.data.name.trim()
      }

      if (input.data.criteria !== undefined) {
        updateValues.criteria = input.data.criteria
      }

      const [updated] = await db
        .update(filterTemplates)
        .set(updateValues)
        .where(eq(filterTemplates.id, input.id))
        .returning()

      if (!updated) {
        throw new Error('Filter template not found')
      }

      return {
        id: updated.id,
        name: updated.name,
        criteria: updated.criteria as FilterCriteria,
        use_count: updated.useCount,
        last_used_at: updated.lastUsedAt ? updated.lastUsedAt.toISOString() : null,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      }
    }),

  recordUse: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }): Promise<FilterTemplate> => {
      const [updated] = await db
        .update(filterTemplates)
        .set({
          useCount: sql`${filterTemplates.useCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(filterTemplates.id, input.id))
        .returning()

      if (!updated) {
        throw new Error('Filter template not found')
      }

      return {
        id: updated.id,
        name: updated.name,
        criteria: updated.criteria as FilterCriteria,
        use_count: updated.useCount,
        last_used_at: updated.lastUsedAt ? updated.lastUsedAt.toISOString() : null,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      }
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(filterTemplates)
        .where(eq(filterTemplates.id, input.id))
        .returning()

      if (!deleted) {
        throw new Error('Filter template not found')
      }

      return { success: true, id: deleted.id }
    }),
})

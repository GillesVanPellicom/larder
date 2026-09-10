import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { publicProcedure, router } from '../trpc'
import { db } from '../../db'
import { metadataConfigTable } from '../../db/schema'
import type { MetadataConfig, TimeTrackingMode } from '../../../../shared/types'
import { recipeViolationService } from '../../services/recipeViolationService'

const mandatoryFieldsSchema = z.object({
  title: z.boolean().default(true),
  ingredients: z.boolean().default(true),
  instructions: z.boolean().default(true),
  image_url: z.boolean().default(false),
  description: z.boolean().default(false),
  yield_amount: z.boolean().default(false),
  prep_time_minutes: z.boolean().default(false),
  cook_time_minutes: z.boolean().default(false),
  source_url: z.boolean().default(false),
})

const metadataConfigInputSchema = z.object({
  mandatoryFields: mandatoryFieldsSchema,
  mandatoryCategories: z.array(z.string()).default([]),
  timeTrackingMode: z.enum(['prep_and_cook', 'total_only', 'no_cook']).optional().default('prep_and_cook'),
})

export const configRouter = router({
  get: publicProcedure.query(async (): Promise<MetadataConfig> => {
    const rows = await db
      .select()
      .from(metadataConfigTable)
      .where(eq(metadataConfigTable.id, 'global'))

    if (rows.length === 0) {
      return {
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
    }

    const row = rows[0]
    return {
      mandatoryFields: row.mandatoryFields,
      mandatoryCategories: row.mandatoryCategories,
      timeTrackingMode: (row.timeTrackingMode as TimeTrackingMode) || 'prep_and_cook',
      updated_at: row.updatedAt ? row.updatedAt.toISOString() : undefined,
    }
  }),

  update: publicProcedure
    .input(metadataConfigInputSchema)
    .mutation(async ({ input }): Promise<MetadataConfig> => {
      const mandatoryFields = { ...input.mandatoryFields }
      const mandatoryCategories = input.mandatoryCategories || []
      const timeTrackingMode = input.timeTrackingMode || 'prep_and_cook'

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
          mandatoryCategories,
          timeTrackingMode,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: metadataConfigTable.id,
          set: {
            mandatoryFields,
            mandatoryCategories,
            timeTrackingMode,
            updatedAt: new Date(),
          },
        })
        .returning()

      // Recalculate stored violations across all recipes
      await recipeViolationService.recalculateAllViolations()

      return {
        mandatoryFields: updated.mandatoryFields,
        mandatoryCategories: updated.mandatoryCategories,
        timeTrackingMode: updated.timeTrackingMode as TimeTrackingMode,
        updated_at: updated.updatedAt.toISOString(),
      }
    }),
})

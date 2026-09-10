import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { publicProcedure, router } from '../trpc'
import { db, pool } from '../../db'
import { recipes, type RecipeRow } from '../../db/schema'
import { recipeViolationService } from '../../services/recipeViolationService'
import { formatRecipeRow, recipeQueryService } from '../../services/recipeQueryService'
import type {
  CreateRecipeDTO,
  IngredientItem,
  PaginatedRecipesResponse,
  Recipe,
  RecipeQueryParams,
} from '../../../../shared/types'

async function getRecipeWithIngredients(id: number): Promise<{ row: RecipeRow; ingredients: IngredientItem[] } | null> {
  const [row] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), isNull(recipes.deletedAt)))

  if (!row) return null

  const ingResult = await pool.query<{
    id: number
    ingredient_id: number
    name: string
    amount: string
    unit: string
    notes?: string
    sort_order: number
  }>(
    `SELECT ri.id, ri.ingredient_id, ing.name, ri.amount, ri.unit, ri.notes, ri.sort_order
     FROM recipe_ingredients ri
     JOIN ingredients ing ON ing.id = ri.ingredient_id
     WHERE ri.recipe_id = $1
     ORDER BY ri.sort_order ASC, ri.id ASC`,
    [id]
  )

  const ingredients: IngredientItem[] = ingResult.rows.map((r) => ({
    id: String(r.id),
    ingredient_id: r.ingredient_id,
    name: r.name,
    amount: r.amount || '',
    unit: r.unit || '',
    notes: r.notes || '',
  }))

  return { row, ingredients }
}

function syncCoreColumns(body: Partial<CreateRecipeDTO>) {
  const title = body.title || ''
  const description = body.description || ''
  const rawYield = body.yield_amount !== undefined ? Number(body.yield_amount) : 4
  const yieldAmount = Number.isNaN(rawYield) || rawYield <= 0 ? 4 : Math.round(rawYield)
  const yieldUnit = body.yield_unit ? String(body.yield_unit).trim() : 'servings'
  const prep = body.prep_time_minutes !== undefined ? Number(body.prep_time_minutes) : 0
  const cook = body.cook_time_minutes !== undefined ? Number(body.cook_time_minutes) : 0
  const total = body.total_time_minutes !== undefined ? Number(body.total_time_minutes) : prep + cook
  const imageUrl = body.image_url || ''
  const sourceUrl = body.source_url || ''
  const instructions = body.instructions || ''
  const tags = body.tags || {}

  return {
    title: String(title).trim(),
    description: String(description).trim(),
    yieldAmount,
    yieldUnit: yieldUnit || 'servings',
    prepTimeMinutes: prep,
    cookTimeMinutes: cook,
    totalTimeMinutes: total,
    imageUrl: String(imageUrl).trim(),
    sourceUrl: String(sourceUrl).trim(),
    instructions,
    tags,
  }
}

interface ValidatedIngredient {
  ingredient_id: number
  name: string
  amount: string
  unit: string
  notes?: string
  sort_order: number
}

async function validateAndResolveIngredients(
  rawIngredients: IngredientItem[] | undefined
): Promise<ValidatedIngredient[]> {
  if (!rawIngredients || !Array.isArray(rawIngredients)) return []

  const activeItems = rawIngredients.filter((i) => i && i.name && i.name.trim().length > 0)
  if (activeItems.length === 0) return []

  const targetIds = activeItems.map((i) => i.ingredient_id).filter((id): id is number => typeof id === 'number')
  const targetNames = activeItems.map((i) => i.name.trim().toLowerCase())

  const dbIngredients = await pool.query<{ id: number; name: string }>(
    `SELECT id, name FROM ingredients WHERE id = ANY($1::int[]) OR lower(name) = ANY($2::text[])`,
    [targetIds, targetNames]
  )

  const byId = new Map<number, { id: number; name: string }>()
  const byLowerName = new Map<string, { id: number; name: string }>()
  for (const row of dbIngredients.rows) {
    byId.set(row.id, row)
    byLowerName.set(row.name.toLowerCase(), row)
  }

  const validated: ValidatedIngredient[] = []
  for (let sort_order = 0; sort_order < activeItems.length; sort_order++) {
    const item = activeItems[sort_order]
    const trimmedName = item.name.trim()

    let dbMatch: { id: number; name: string } | undefined
    if (item.ingredient_id && byId.has(item.ingredient_id)) {
      dbMatch = byId.get(item.ingredient_id)
    } else {
      dbMatch = byLowerName.get(trimmedName.toLowerCase())
    }

    if (!dbMatch) {
      throw new Error(
        `Ingredient "${trimmedName}" is not registered in the database. Please select an existing ingredient or create it first.`
      )
    }

    validated.push({
      ingredient_id: dbMatch.id,
      name: dbMatch.name,
      amount: item.amount ? String(item.amount).trim() : '',
      unit: item.unit ? String(item.unit).trim() : '',
      notes: item.notes ? String(item.notes).trim() : '',
      sort_order,
    })
  }

  return validated
}

export const recipesRouter = router({
  getDistinctIngredients: publicProcedure.query(async (): Promise<string[]> => {
    return await recipeQueryService.getDistinctIngredients()
  }),

  list: publicProcedure
    .input(
      z
        .object({
          searchQuery: z.string().optional(),
          selectedIngredients: z.array(z.string()).optional(),
          ingredientsMatchMode: z.enum(['any', 'all', 'none']).optional(),
          selectedTags: z.record(z.string(), z.array(z.string())).optional(),
          tagsMatchMode: z.enum(['any', 'all', 'none']).optional(),
          categoryTagsMatchMode: z.record(z.string(), z.enum(['any', 'all', 'none'])).optional(),
          maxTotalTime: z.number().optional(),
          maxPrepTime: z.number().optional(),
          maxCookTime: z.number().optional(),
          hasImage: z.union([z.enum(['any', 'none', 'only']), z.boolean(), z.null()]).optional(),
          onlyConflicts: z.union([z.enum(['any', 'none', 'only']), z.boolean()]).optional(),
          sortBy: z
            .enum([
              'created_desc',
              'created_asc',
              'title_asc',
              'title_desc',
              'total_time_asc',
              'total_time_desc',
            ])
            .optional(),
          page: z.number().optional().default(1),
          pageSize: z.number().optional().default(12),
        })
        .optional()
    )
    .query(async ({ input }): Promise<PaginatedRecipesResponse> => {
      const params: RecipeQueryParams = {
        searchQuery: input?.searchQuery,
        selectedIngredients: input?.selectedIngredients || [],
        ingredientsMatchMode: input?.ingredientsMatchMode || 'any',
        selectedTags: input?.selectedTags || {},
        tagsMatchMode: input?.tagsMatchMode || 'any',
        categoryTagsMatchMode: input?.categoryTagsMatchMode || {},
        maxTotalTime: input?.maxTotalTime,
        maxPrepTime: input?.maxPrepTime,
        maxCookTime: input?.maxCookTime,
        hasImage: input?.hasImage,
        onlyConflicts: input?.onlyConflicts,
        sortBy: input?.sortBy || 'created_desc',
        page: input?.page || 1,
        pageSize: input?.pageSize || 12,
      }

      return await recipeQueryService.queryRecipes(params)
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }): Promise<Recipe> => {
      const recipeData = await getRecipeWithIngredients(input.id)
      if (!recipeData) {
        throw new Error('Recipe not found')
      }
      return formatRecipeRow(recipeData.row, recipeData.ingredients)
    }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Recipe title is required'),
        description: z.string().optional().default(''),
        yield_amount: z.number().optional().default(4),
        yield_unit: z.string().optional().default('servings'),
        prep_time_minutes: z.number().optional().default(0),
        cook_time_minutes: z.number().optional().default(0),
        total_time_minutes: z.number().optional().default(0),
        image_url: z.string().optional().default(''),
        source_url: z.string().optional().default(''),
        ingredients: z
          .array(
            z.object({
              id: z.union([z.string(), z.number()]).optional(),
              ingredient_id: z.number().optional(),
              name: z.string(),
              amount: z.string().optional(),
              unit: z.string().optional(),
              notes: z.string().optional(),
            })
          )
          .optional()
          .default([]),
        instructions: z.union([z.string(), z.array(z.any())]).optional().default(''),
        tags: z.record(z.string(), z.array(z.string())).optional().default({}),
      })
    )
    .mutation(async ({ input }): Promise<Recipe> => {
      const synced = syncCoreColumns(input as unknown as CreateRecipeDTO)
      if (!synced.title) {
        throw new Error('Recipe title is required')
      }

      const validatedIngredients = await validateAndResolveIngredients(input.ingredients)

      const { hasViolations, violations } = await recipeViolationService.getViolationsForPayload({
        ...synced,
        ingredients: validatedIngredients,
      })

      const [created] = await db
        .insert(recipes)
        .values({
          ...synced,
          hasViolations,
          violations,
        })
        .returning()

      if (validatedIngredients.length > 0) {
        const values: unknown[] = []
        const placeholders = validatedIngredients
          .map((ing, idx) => {
            const base = idx * 6
            values.push(created.id, ing.ingredient_id, ing.amount, ing.unit, ing.notes || '', ing.sort_order)
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
          })
          .join(', ')

        await pool.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, notes, sort_order)
           VALUES ${placeholders}`,
          values
        )
      }

      const recipeData = await getRecipeWithIngredients(created.id)
      return formatRecipeRow(recipeData!.row, recipeData!.ingredients)
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          yield_amount: z.number().optional(),
          yield_unit: z.string().optional(),
          prep_time_minutes: z.number().optional(),
          cook_time_minutes: z.number().optional(),
          total_time_minutes: z.number().optional(),
          image_url: z.string().optional(),
          source_url: z.string().optional(),
          ingredients: z
            .array(
              z.object({
                id: z.union([z.string(), z.number()]).optional(),
                ingredient_id: z.number().optional(),
                name: z.string(),
                amount: z.string().optional(),
                unit: z.string().optional(),
                notes: z.string().optional(),
              })
            )
            .optional(),
          instructions: z.union([z.string(), z.array(z.any())]).optional(),
          tags: z.record(z.string(), z.array(z.string())).optional(),
        }),
      })
    )
    .mutation(async ({ input }): Promise<Recipe> => {
      const synced = syncCoreColumns(input.data as unknown as Partial<CreateRecipeDTO>)

      let validatedIngredients: ValidatedIngredient[] | null = null
      if (input.data.ingredients !== undefined) {
        validatedIngredients = await validateAndResolveIngredients(input.data.ingredients)
      }

      const { hasViolations, violations } = await recipeViolationService.getViolationsForPayload({
        ...synced,
        ingredients: validatedIngredients !== null ? validatedIngredients : undefined,
      })

      const updatePayload: Record<string, unknown> = {
        ...synced,
        hasViolations,
        violations,
        updatedAt: new Date(),
      }

      const [updated] = await db
        .update(recipes)
        .set(updatePayload)
        .where(eq(recipes.id, input.id))
        .returning()

      if (!updated) {
        throw new Error('Recipe not found')
      }

      if (validatedIngredients !== null) {
        await pool.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [input.id])
        if (validatedIngredients.length > 0) {
          const values: unknown[] = []
          const placeholders = validatedIngredients
            .map((ing, idx) => {
              const base = idx * 6
              values.push(input.id, ing.ingredient_id, ing.amount, ing.unit, ing.notes || '', ing.sort_order)
              return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
            })
            .join(', ')

          await pool.query(
            `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit, notes, sort_order)
             VALUES ${placeholders}`,
            values
          )
        }
      }

      const recipeData = await getRecipeWithIngredients(input.id)
      return formatRecipeRow(recipeData!.row, recipeData!.ingredients)
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .update(recipes)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(recipes.id, input.id))
        .returning({ id: recipes.id })

      if (!deleted) {
        throw new Error('Recipe not found')
      }

      return { success: true, id: deleted.id }
    }),
})

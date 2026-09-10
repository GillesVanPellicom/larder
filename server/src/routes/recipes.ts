import { Router } from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { db, pool } from '../db'
import { recipes, type RecipeRow } from '../db/schema'
import { recipeViolationService } from '../services/recipeViolationService'
import { formatRecipeRow, recipeQueryService } from '../services/recipeQueryService'
import type {
  CreateRecipeDTO,
  IngredientItem,
  MatchMode,
  RecipeQueryParams,
  RecipeSortOption,
  TriStateFilter,
} from '../../../shared/types'

const router = Router()

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

// GET /api/recipes/ingredients - Fetch distinct ingredient names for search/filter autocomplete
router.get('/ingredients', async (_req, res) => {
  try {
    const list = await recipeQueryService.getDistinctIngredients()
    res.json(list)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch ingredients:', err)
    res.status(500).json({ error: 'Failed to fetch ingredients', details })
  }
})

// GET /api/recipes - Query recipes with server-side database filtering and pagination
router.get('/', async (req, res) => {
  try {
    const query = req.query

    // Parse ingredients array
    let selectedIngredients: string[] = []
    if (query.selectedIngredients) {
      if (Array.isArray(query.selectedIngredients)) {
        selectedIngredients = query.selectedIngredients as string[]
      } else if (typeof query.selectedIngredients === 'string') {
        try {
          const parsed = JSON.parse(query.selectedIngredients)
          selectedIngredients = Array.isArray(parsed) ? parsed : [query.selectedIngredients]
        } catch {
          selectedIngredients = query.selectedIngredients.split(',').map((s) => s.trim()).filter(Boolean)
        }
      }
    }

    // Parse selectedTags record
    let selectedTags: Record<string, string[]> = {}
    if (query.selectedTags) {
      if (typeof query.selectedTags === 'object' && !Array.isArray(query.selectedTags)) {
        selectedTags = query.selectedTags as Record<string, string[]>
      } else if (typeof query.selectedTags === 'string') {
        try {
          selectedTags = JSON.parse(query.selectedTags)
        } catch {
          // ignore parsing error
        }
      }
    }

    // Parse categoryTagsMatchMode
    let categoryTagsMatchMode: Record<string, MatchMode> = {}
    if (query.categoryTagsMatchMode) {
      if (typeof query.categoryTagsMatchMode === 'object' && !Array.isArray(query.categoryTagsMatchMode)) {
        categoryTagsMatchMode = query.categoryTagsMatchMode as Record<string, MatchMode>
      } else if (typeof query.categoryTagsMatchMode === 'string') {
        try {
          categoryTagsMatchMode = JSON.parse(query.categoryTagsMatchMode)
        } catch {
          // ignore
        }
      }
    }

    // Parse hasImage tri-state ('any' | 'none' | 'only')
    let hasImage: TriStateFilter | boolean | undefined = undefined
    if (query.hasImage === 'only' || query.hasImage === 'true') {
      hasImage = 'only'
    } else if (query.hasImage === 'none' || query.hasImage === 'false') {
      hasImage = 'none'
    } else if (query.hasImage === 'any') {
      hasImage = 'any'
    }

    // Parse onlyConflicts tri-state ('any' | 'none' | 'only')
    let onlyConflicts: TriStateFilter | boolean | undefined = undefined
    if (query.onlyConflicts === 'only' || query.onlyConflicts === 'true') {
      onlyConflicts = 'only'
    } else if (query.onlyConflicts === 'none' || query.onlyConflicts === 'false') {
      onlyConflicts = 'none'
    } else if (query.onlyConflicts === 'any') {
      onlyConflicts = 'any'
    }

    const params: RecipeQueryParams = {
      searchQuery: typeof query.searchQuery === 'string' ? query.searchQuery : (typeof query.q === 'string' ? query.q : undefined),
      selectedIngredients,
      ingredientsMatchMode: (query.ingredientsMatchMode as MatchMode) || 'any',
      selectedTags,
      tagsMatchMode: (query.tagsMatchMode as MatchMode) || 'any',
      categoryTagsMatchMode,
      maxTotalTime: query.maxTotalTime ? Number(query.maxTotalTime) : undefined,
      maxPrepTime: query.maxPrepTime ? Number(query.maxPrepTime) : undefined,
      maxCookTime: query.maxCookTime ? Number(query.maxCookTime) : undefined,
      hasImage,
      onlyConflicts,
      sortBy: (query.sortBy as RecipeSortOption) || 'created_desc',
      page: query.page ? Number(query.page) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 12,
    }

    const result = await recipeQueryService.queryRecipes(params)
    console.log(
      `[Recipes Query] Page ${params.page}/${result.totalPages} (size: ${params.pageSize}) | total: ${result.totalCount} recipes | search="${params.searchQuery || ''}" image=${params.hasImage || 'any'} conflicts=${params.onlyConflicts || 'any'}`
    )
    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to fetch recipes:', err)
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

    const recipeData = await getRecipeWithIngredients(id)
    if (!recipeData) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    res.json(formatRecipeRow(recipeData.row, recipeData.ingredients))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to fetch recipe:', err)
    res.status(500).json({ error: 'Failed to fetch recipe', details })
  }
})

// Helper to extract core columns from request body
function syncCoreColumns(body: Partial<CreateRecipeDTO>) {
  const title = body.title || ''
  const description = body.description || ''
  const rawYield = body.yield_amount !== undefined ? Number(body.yield_amount) : 4
  const yieldAmount = Number.isNaN(rawYield) || rawYield <= 0 ? 4 : Math.round(rawYield)
  const yieldUnit = body.yield_unit ? String(body.yield_unit).trim() : 'servings'
  const prep = body.prep_time_minutes !== undefined ? Number(body.prep_time_minutes) : 0
  const cook = body.cook_time_minutes !== undefined ? Number(body.cook_time_minutes) : 0
  const total = body.total_time_minutes !== undefined ? Number(body.total_time_minutes) : (prep + cook)
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
  sort_order: number
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

  // Extract all IDs and lowercased names for single batch query
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

// POST /api/recipes
router.post('/', async (req, res) => {
  try {
    const body = req.body as CreateRecipeDTO

    const synced = syncCoreColumns(body)

    if (!synced.title) {
      return res.status(400).json({ error: 'Recipe title is required' })
    }

    // Validate that all ingredients exist in the normalized ingredients database
    const validatedIngredients = await validateAndResolveIngredients(body.ingredients)

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

    // Batch insert relational ingredient rows
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
    res.status(201).json(formatRecipeRow(recipeData!.row, recipeData!.ingredients))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to create recipe:', err)
    res.status(400).json({ error: details || 'Failed to create recipe' })
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
    const synced = syncCoreColumns(body)

    // Validate ingredients if provided
    let validatedIngredients: ValidatedIngredient[] | null = null
    if (body.ingredients !== undefined) {
      validatedIngredients = await validateAndResolveIngredients(body.ingredients)
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
      .where(eq(recipes.id, id))
      .returning()

    if (!updated) {
      return res.status(404).json({ error: 'Recipe not found' })
    }

    // If ingredients were updated, replace recipe_ingredients records
    if (validatedIngredients !== null) {
      await pool.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [id])
      if (validatedIngredients.length > 0) {
        const values: unknown[] = []
        const placeholders = validatedIngredients
          .map((ing, idx) => {
            const base = idx * 6
            values.push(id, ing.ingredient_id, ing.amount, ing.unit, ing.notes || '', ing.sort_order)
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

    const recipeData = await getRecipeWithIngredients(id)
    res.json(formatRecipeRow(recipeData!.row, recipeData!.ingredients))
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    console.error('Failed to update recipe:', err)
    res.status(400).json({ error: details || 'Failed to update recipe' })
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

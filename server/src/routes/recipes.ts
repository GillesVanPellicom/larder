import { Router } from 'express'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { recipes } from '../db/schema'
import { recipeViolationService } from '../services/recipeViolationService'
import { recipeQueryService } from '../services/recipeQueryService'
import type {
  CreateRecipeDTO,
  InstructionStep,
  MatchMode,
  Recipe,
  RecipeQueryParams,
  RecipeSortOption,
  TriStateFilter,
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
    yield_unit: r.yieldUnit || 'servings',
    prep_time_minutes: r.prepTimeMinutes,
    cook_time_minutes: r.cookTimeMinutes,
    total_time_minutes: r.totalTimeMinutes,
    image_url: r.imageUrl,
    source_url: r.sourceUrl,
    ingredients,
    instructions,
    tags: r.tags || {},
    has_violations: r.hasViolations ?? false,
    violations: r.violations || [],
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
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
  const ingredients = body.ingredients || []
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
    ingredients,
    instructions,
    tags,
  }
}

// POST /api/recipes
router.post('/', async (req, res) => {
  try {
    const body = req.body as CreateRecipeDTO

    const synced = syncCoreColumns(body)

    if (!synced.title) {
      return res.status(400).json({ error: 'Recipe title is required' })
    }

    const { hasViolations, violations } = await recipeViolationService.getViolationsForPayload(synced)

    const [created] = await db
      .insert(recipes)
      .values({
        ...synced,
        hasViolations,
        violations,
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
    const synced = syncCoreColumns(body)

    const { hasViolations, violations } = await recipeViolationService.getViolationsForPayload(synced)

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

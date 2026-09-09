import { and, asc, desc, isNull, sql, type SQL } from 'drizzle-orm'
import { db, pool } from '../db'
import { recipes, type RecipeRow } from '../db/schema'
import type {
  IngredientItem,
  InstructionStep,
  PaginatedRecipesResponse,
  Recipe,
  RecipeQueryParams,
  RecipeSortOption,
} from '../../../shared/types'

export function formatRecipeRow(r: RecipeRow, ingredients: IngredientItem[] = []): Recipe {
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

export async function attachIngredientsToRecipes(rows: RecipeRow[]): Promise<Recipe[]> {
  if (rows.length === 0) return []
  const recipeIds = rows.map((r) => r.id)

  const result = await pool.query<{
    id: number
    recipe_id: number
    ingredient_id: number
    name: string
    amount: string
    unit: string
    sort_order: number
  }>(
    `SELECT ri.id, ri.recipe_id, ri.ingredient_id, ing.name, ri.amount, ri.unit, ri.sort_order
     FROM recipe_ingredients ri
     JOIN ingredients ing ON ing.id = ri.ingredient_id
     WHERE ri.recipe_id = ANY($1::int[])
     ORDER BY ri.sort_order ASC, ri.id ASC`,
    [recipeIds]
  )

  const ingredientsByRecipe = new Map<number, IngredientItem[]>()
  for (const row of result.rows) {
    if (!ingredientsByRecipe.has(row.recipe_id)) {
      ingredientsByRecipe.set(row.recipe_id, [])
    }
    ingredientsByRecipe.get(row.recipe_id)!.push({
      id: String(row.id),
      ingredient_id: row.ingredient_id,
      name: row.name,
      amount: row.amount || '',
      unit: row.unit || '',
    })
  }

  return rows.map((r) => formatRecipeRow(r, ingredientsByRecipe.get(r.id) || []))
}

export class RecipeQueryService {
  /**
   * Get all distinct ingredient names directly from the DB ingredients table.
   */
  public async getDistinctIngredients(): Promise<string[]> {
    try {
      const res = await pool.query<{ name: string }>(`
        SELECT name FROM ingredients ORDER BY name ASC
      `)
      return res.rows.map((r) => r.name)
    } catch (err) {
      console.error('[RecipeQueryService] Failed to fetch distinct ingredients:', err)
      return []
    }
  }

  /**
   * Build modular SQL filter conditions based on query params using relational joins.
   */
  private async buildFilterConditions(params: RecipeQueryParams): Promise<SQL[]> {
    const conditions: SQL[] = [isNull(recipes.deletedAt)]

    // 1. Full-text search across Title, Description, Source, Relational Ingredients, Instructions
    if (params.searchQuery && params.searchQuery.trim()) {
      const q = `%${params.searchQuery.trim().toLowerCase()}%`
      conditions.push(
        sql`(
          lower(${recipes.title}) LIKE ${q}
          OR lower(${recipes.description}) LIKE ${q}
          OR lower(${recipes.sourceUrl}) LIKE ${q}
          OR lower(${recipes.instructions}::text) LIKE ${q}
          OR EXISTS (
            SELECT 1 FROM recipe_ingredients ri
            JOIN ingredients ing ON ing.id = ri.ingredient_id
            WHERE ri.recipe_id = ${recipes.id} AND lower(ing.name) LIKE ${q}
          )
        )`
      )
    }

    // 2. Ingredients Filter (ANY vs ALL vs NONE) via relational tables
    if (params.selectedIngredients && params.selectedIngredients.length > 0) {
      const matchMode = params.ingredientsMatchMode || 'any'
      const activeIngredients = params.selectedIngredients
        .map((i) => i.trim().toLowerCase())
        .filter(Boolean)

      if (activeIngredients.length > 0) {
        if (matchMode === 'all') {
          for (const target of activeIngredients) {
            const pattern = `%${target}%`
            conditions.push(
              sql`EXISTS (
                SELECT 1 FROM recipe_ingredients ri
                JOIN ingredients ing ON ing.id = ri.ingredient_id
                WHERE ri.recipe_id = ${recipes.id} AND lower(ing.name) LIKE ${pattern}
              )`
            )
          }
        } else if (matchMode === 'none') {
          for (const target of activeIngredients) {
            const pattern = `%${target}%`
            conditions.push(
              sql`NOT EXISTS (
                SELECT 1 FROM recipe_ingredients ri
                JOIN ingredients ing ON ing.id = ri.ingredient_id
                WHERE ri.recipe_id = ${recipes.id} AND lower(ing.name) LIKE ${pattern}
              )`
            )
          }
        } else {
          const ingClauses = activeIngredients.map((target) => {
            const pattern = `%${target}%`
            return sql`lower(ing.name) LIKE ${pattern}`
          })
          conditions.push(
            sql`EXISTS (
              SELECT 1 FROM recipe_ingredients ri
              JOIN ingredients ing ON ing.id = ri.ingredient_id
              WHERE ri.recipe_id = ${recipes.id} AND (${sql.join(ingClauses, sql` OR `)})
            )`
          )
        }
      }
    }

    // 3. Selected Tags per Category (ANY vs ALL vs NONE)
    if (params.selectedTags && typeof params.selectedTags === 'object') {
      const catEntries = Object.entries(params.selectedTags).filter(
        ([_, tags]) => Array.isArray(tags) && tags.length > 0
      )

      for (const [catId, tags] of catEntries) {
        const catMode = params.categoryTagsMatchMode?.[catId] || params.tagsMatchMode || 'any'
        const cleanTags = tags.map((t) => t.trim()).filter(Boolean)
        if (cleanTags.length === 0) continue

        const tagClauses = cleanTags.map(
          (tag) => sql`EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(coalesce(${recipes.tags}->${catId}, '[]'::jsonb)) AS elem
            WHERE lower(elem) = lower(${tag})
          )`
        )

        if (catMode === 'all') {
          conditions.push(sql`(${sql.join(tagClauses, sql` AND `)})`)
        } else if (catMode === 'none') {
          conditions.push(sql`NOT (${sql.join(tagClauses, sql` OR `)})`)
        } else {
          conditions.push(sql`(${sql.join(tagClauses, sql` OR `)})`)
        }
      }
    }

    // 4. Max Time Constraints
    if (params.maxTotalTime !== undefined && !isNaN(Number(params.maxTotalTime))) {
      conditions.push(sql`${recipes.totalTimeMinutes} <= ${Number(params.maxTotalTime)}`)
    }
    if (params.maxPrepTime !== undefined && !isNaN(Number(params.maxPrepTime))) {
      conditions.push(sql`${recipes.prepTimeMinutes} <= ${Number(params.maxPrepTime)}`)
    }
    if (params.maxCookTime !== undefined && !isNaN(Number(params.maxCookTime))) {
      conditions.push(sql`${recipes.cookTimeMinutes} <= ${Number(params.maxCookTime)}`)
    }

    // 5. Image Presence (only vs none vs any)
    if (params.hasImage === 'only' || params.hasImage === true) {
      conditions.push(sql`length(trim(coalesce(${recipes.imageUrl}, ''))) > 0`)
    } else if (params.hasImage === 'none' || params.hasImage === false) {
      conditions.push(sql`length(trim(coalesce(${recipes.imageUrl}, ''))) = 0`)
    }

    // 6. Data Rule Violations / Conflicts Filter (only vs none vs any)
    if (params.onlyConflicts === 'only' || params.onlyConflicts === true) {
      conditions.push(sql`coalesce(${recipes.hasViolations}, false) = true`)
    } else if (params.onlyConflicts === 'none' || params.onlyConflicts === false) {
      conditions.push(sql`coalesce(${recipes.hasViolations}, false) = false`)
    }

    return conditions
  }

  /**
   * Determine sort order SQL clause.
   */
  private getOrderByClause(sortBy?: RecipeSortOption): SQL {
    switch (sortBy) {
      case 'created_asc':
        return asc(recipes.id)
      case 'title_asc':
        return asc(recipes.title)
      case 'title_desc':
        return desc(recipes.title)
      case 'total_time_asc':
        return asc(recipes.totalTimeMinutes)
      case 'total_time_desc':
        return desc(recipes.totalTimeMinutes)
      case 'created_desc':
      default:
        return desc(recipes.id)
    }
  }

  /**
   * Execute paginated recipe search with DB filtering.
   */
  public async queryRecipes(params: RecipeQueryParams): Promise<PaginatedRecipesResponse> {
    const page = Math.max(1, Number(params.page) || 1)
    const pageSize = Math.max(1, Math.min(200, Number(params.pageSize) || 12))
    const offset = (page - 1) * pageSize

    try {
      const conditions = await this.buildFilterConditions(params)
      const whereClause = and(...conditions)
      const orderByClause = this.getOrderByClause(params.sortBy)

      // 1. Total matching count query
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(recipes)
        .where(whereClause)

      const totalCount = countResult?.count || 0
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

      // 2. Fetch paginated records
      const rows = await db
        .select()
        .from(recipes)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset)

      // 3. Attach relational ingredients to recipes
      const items = await attachIngredientsToRecipes(rows)

      return {
        items,
        totalCount,
        page,
        pageSize,
        totalPages,
      }
    } catch (err) {
      console.error('[DATABASE ERROR] Failed in RecipeQueryService.queryRecipes:', err)
      console.error('[DATABASE ERROR] Query params were:', JSON.stringify(params, null, 2))
      throw err
    }
  }
}

export const recipeQueryService = new RecipeQueryService()

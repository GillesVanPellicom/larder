import { and, asc, desc, isNull, sql, type SQL } from 'drizzle-orm'
import { db, pool } from '../db'
import { recipes } from '../db/schema'
import type {
  InstructionStep,
  PaginatedRecipesResponse,
  Recipe,
  RecipeQueryParams,
  RecipeSortOption,
} from '../../../shared/types'

export function formatRecipeRow(r: typeof recipes.$inferSelect): Recipe {
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

export class RecipeQueryService {
  /**
   * Get all distinct ingredient names directly from the DB JSONB arrays.
   */
  public async getDistinctIngredients(): Promise<string[]> {
    try {
      const res = await pool.query<{ name: string }>(`
        SELECT DISTINCT lower(trim(elem->>'name')) AS name
        FROM recipes, jsonb_array_elements(recipes.ingredients) AS elem
        WHERE recipes.deleted_at IS NULL
          AND elem->>'name' IS NOT NULL
          AND length(trim(elem->>'name')) > 0
        ORDER BY name ASC
      `)
      return res.rows.map((r) => r.name)
    } catch (err) {
      console.error('[RecipeQueryService] Failed to fetch distinct ingredients:', err)
      return []
    }
  }

  /**
   * Build modular SQL filter conditions based on query params.
   */
  private async buildFilterConditions(params: RecipeQueryParams): Promise<SQL[]> {
    const conditions: SQL[] = [isNull(recipes.deletedAt)]

    // 1. Full-text search across Title, Description, Source, Ingredients, Instructions
    if (params.searchQuery && params.searchQuery.trim()) {
      const q = `%${params.searchQuery.trim().toLowerCase()}%`
      conditions.push(
        sql`(
          lower(${recipes.title}) LIKE ${q}
          OR lower(${recipes.description}) LIKE ${q}
          OR lower(${recipes.sourceUrl}) LIKE ${q}
          OR lower(${recipes.instructions}::text) LIKE ${q}
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements(${recipes.ingredients}) AS ing
            WHERE lower(coalesce(ing->>'name', '')) LIKE ${q}
          )
        )`
      )
    }

    // 2. Ingredients Filter (ANY vs ALL vs NONE)
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
                SELECT 1 FROM jsonb_array_elements(${recipes.ingredients}) AS ing
                WHERE lower(coalesce(ing->>'name', '')) LIKE ${pattern}
              )`
            )
          }
        } else if (matchMode === 'none') {
          for (const target of activeIngredients) {
            const pattern = `%${target}%`
            conditions.push(
              sql`NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(${recipes.ingredients}) AS ing
                WHERE lower(coalesce(ing->>'name', '')) LIKE ${pattern}
              )`
            )
          }
        } else {
          const ingClauses = activeIngredients.map((target) => {
            const pattern = `%${target}%`
            return sql`EXISTS (
              SELECT 1 FROM jsonb_array_elements(${recipes.ingredients}) AS ing
              WHERE lower(coalesce(ing->>'name', '')) LIKE ${pattern}
            )`
          })
          conditions.push(sql`(${sql.join(ingClauses, sql` OR `)})`)
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
          (tag) => sql`${recipes.tags}->${catId} @> jsonb_build_array(${tag})`
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

      return {
        items: rows.map(formatRecipeRow),
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

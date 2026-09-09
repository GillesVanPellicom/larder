import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET /api/ingredients - Search ingredients with pagination, usage count, and sorting
router.get('/', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.max(1, Math.min(100, Number(req.query.pageSize) || Number(req.query.limit) || 10))
    const offset = req.query.page !== undefined ? (page - 1) * limit : Math.max(0, Number(req.query.offset) || 0)

    const rawSortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy.toLowerCase() : ''
    const rawSortOrder = typeof req.query.sortOrder === 'string' ? req.query.sortOrder.toUpperCase() : ''
    const sortOrder = rawSortOrder === 'DESC' ? 'DESC' : rawSortOrder === 'ASC' ? 'ASC' : ''

    let orderByClause = 'i.name ASC'
    if (rawSortBy === 'usage_count' || rawSortBy === 'usage' || rawSortBy === 'recipes') {
      orderByClause = `usage_count ${sortOrder || 'DESC'}, i.name ASC`
    } else if (rawSortBy === 'created_at' || rawSortBy === 'date') {
      orderByClause = `i.created_at ${sortOrder || 'DESC'}, i.name ASC`
    } else if (rawSortBy === 'name') {
      orderByClause = `i.name ${sortOrder || 'ASC'}`
    } else {
      orderByClause = 'i.name ASC'
    }

    if (!q) {
      // Return ingredients with usage count and sorting
      const totalResult = await pool.query<{ count: string }>('SELECT COUNT(*)::text as count FROM ingredients')
      const totalCount = parseInt(totalResult.rows[0]?.count || '0', 10)
      const totalPages = Math.ceil(totalCount / limit) || 1

      const result = await pool.query<{ id: number; name: string; created_at: string; usage_count: number }>(
        `SELECT 
           i.id, 
           i.name, 
           i.created_at, 
           COUNT(DISTINCT ri.recipe_id)::int as usage_count 
         FROM ingredients i
         LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
         GROUP BY i.id, i.name, i.created_at
         ORDER BY ${orderByClause}
         LIMIT $1 OFFSET $2`,
        [limit + 1, offset]
      )

      const hasMore = result.rows.length > limit
      const items = result.rows.slice(0, limit)

      return res.json({
        items,
        totalCount,
        totalPages,
        currentPage: page,
        hasMore,
      })
    }

    const pattern = `%${q}%`
    const totalResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM ingredients WHERE name ILIKE $1`,
      [pattern]
    )
    const totalCount = parseInt(totalResult.rows[0]?.count || '0', 10)
    const totalPages = Math.ceil(totalCount / limit) || 1

    const queryParams: unknown[] = [pattern]
    let paramIndex = 2
    let matchOrderBy = orderByClause

    // If default sorting (no explicit sortBy/sortOrder), prioritize prefix/exact matches for combobox & search UX
    if (!rawSortBy && !rawSortOrder) {
      matchOrderBy = `
        CASE
          WHEN lower(i.name) = lower($${paramIndex}) THEN 1
          WHEN lower(i.name) LIKE lower($${paramIndex}) || '%' THEN 2
          ELSE 3
        END,
        i.name ASC
      `
      queryParams.push(q)
      paramIndex++
    }

    const limitPlaceholder = `$${paramIndex++}`
    const offsetPlaceholder = `$${paramIndex++}`
    queryParams.push(limit + 1, offset)

    const result = await pool.query<{ id: number; name: string; created_at: string; usage_count: number }>(
      `SELECT 
         i.id, 
         i.name, 
         i.created_at, 
         COUNT(DISTINCT ri.recipe_id)::int as usage_count 
       FROM ingredients i
       LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
       WHERE i.name ILIKE $1
       GROUP BY i.id, i.name, i.created_at
       ORDER BY ${matchOrderBy}
       LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      queryParams
    )

    const hasMore = result.rows.length > limit
    const items = result.rows.slice(0, limit)

    return res.json({
      items,
      totalCount,
      totalPages,
      currentPage: page,
      hasMore,
    })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to search ingredients:', err)
    res.status(500).json({ error: 'Failed to search ingredients', details })
  }
})

// GET /api/ingredients/all - Fetch all ingredients
router.get('/all', async (_req, res) => {
  try {
    const result = await pool.query<{ id: number; name: string }>(
      `SELECT id, name FROM ingredients ORDER BY name ASC`
    )
    res.json(result.rows)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to fetch all ingredients:', err)
    res.status(500).json({ error: 'Failed to fetch all ingredients', details })
  }
})

// POST /api/ingredients - Create new normalized ingredient
router.post('/', async (req, res) => {
  try {
    const rawName = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!rawName) {
      return res.status(400).json({ error: 'Ingredient name is required' })
    }

    // Capitalize first letter cleanly if all lowercase, otherwise preserve user formatting
    const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    // Check case-insensitive existence first
    const existing = await pool.query<{ id: number; name: string; created_at: string }>(
      `SELECT id, name, created_at FROM ingredients WHERE lower(name) = lower($1) LIMIT 1`,
      [normalizedName]
    )

    if (existing.rows.length > 0) {
      return res.status(200).json(existing.rows[0])
    }

    const created = await pool.query<{ id: number; name: string; created_at: string }>(
      `INSERT INTO ingredients (name) VALUES ($1) RETURNING id, name, created_at`,
      [normalizedName]
    )

    res.status(201).json(created.rows[0])
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to create ingredient:', err)
    res.status(500).json({ error: 'Failed to create ingredient', details })
  }
})

// PUT /api/ingredients/:id - Update existing ingredient name
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ingredient ID' })
    }

    const rawName = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!rawName) {
      return res.status(400).json({ error: 'Ingredient name cannot be empty' })
    }

    const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    // Check case-insensitive collision with other ingredients
    const collision = await pool.query<{ id: number }>(
      `SELECT id FROM ingredients WHERE lower(name) = lower($1) AND id != $2 LIMIT 1`,
      [normalizedName, id]
    )

    if (collision.rows.length > 0) {
      return res.status(409).json({ error: 'An ingredient with this name already exists' })
    }

    const result = await pool.query<{ id: number; name: string; created_at: string; updated_at: string }>(
      `UPDATE ingredients SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, created_at, updated_at`,
      [normalizedName, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' })
    }

    res.json(result.rows[0])
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to update ingredient:', err)
    res.status(500).json({ error: 'Failed to update ingredient', details })
  }
})

export default router

import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET /api/ingredients - Search ingredients with debounced autocomplete query
router.get('/', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10))
    const offset = Math.max(0, Number(req.query.offset) || 0)

    if (!q) {
      // Return top ingredients alphabetically
      const totalResult = await pool.query<{ count: string }>('SELECT COUNT(*)::text as count FROM ingredients')
      const totalCount = parseInt(totalResult.rows[0]?.count || '0', 10)

      const result = await pool.query<{ id: number; name: string; created_at: string }>(
        `SELECT id, name, created_at FROM ingredients ORDER BY name ASC LIMIT $1 OFFSET $2`,
        [limit + 1, offset]
      )

      const hasMore = result.rows.length > limit
      const items = result.rows.slice(0, limit)

      return res.json({
        items,
        totalCount,
        hasMore,
      })
    }

    const pattern = `%${q}%`
    const totalResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM ingredients WHERE name ILIKE $1`,
      [pattern]
    )
    const totalCount = parseInt(totalResult.rows[0]?.count || '0', 10)

    // Order prioritizing exact match, then prefix matches, then substring matches
    const result = await pool.query<{ id: number; name: string; created_at: string }>(
      `SELECT id, name, created_at
       FROM ingredients
       WHERE name ILIKE $1
       ORDER BY
         CASE
           WHEN lower(name) = lower($2) THEN 1
           WHEN lower(name) LIKE lower($2) || '%' THEN 2
           ELSE 3
         END,
         name ASC
       LIMIT $3 OFFSET $4`,
      [pattern, q, limit + 1, offset]
    )

    const hasMore = result.rows.length > limit
    const items = result.rows.slice(0, limit)

    return res.json({
      items,
      totalCount,
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

export default router

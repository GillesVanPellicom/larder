import { Router } from 'express'
import { pool } from '../db'

const router = Router()

// GET /api/stores - Search stores with pagination and sorting
router.get('/', async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.max(1, Math.min(100, Number(req.query.pageSize) || Number(req.query.limit) || 10))
    const offset = req.query.page !== undefined ? (page - 1) * limit : Math.max(0, Number(req.query.offset) || 0)

    const rawSortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy.toLowerCase() : ''
    const rawSortOrder = typeof req.query.sortOrder === 'string' ? req.query.sortOrder.toUpperCase() : ''
    const sortOrder = rawSortOrder === 'DESC' ? 'DESC' : rawSortOrder === 'ASC' ? 'ASC' : ''

    let orderByClause = 's.name ASC'
    if (rawSortBy === 'created_at' || rawSortBy === 'date') {
      orderByClause = `s.created_at ${sortOrder || 'DESC'}, s.name ASC`
    } else if (rawSortBy === 'name') {
      orderByClause = `s.name ${sortOrder || 'ASC'}`
    } else {
      orderByClause = 's.name ASC'
    }

    if (!q) {
      const totalResult = await pool.query<{ count: string }>('SELECT COUNT(*)::text as count FROM stores')
      const totalCount = parseInt(totalResult.rows[0]?.count || '0', 10)
      const totalPages = Math.ceil(totalCount / limit) || 1

      const result = await pool.query<{ id: number; name: string; created_at: string; updated_at: string }>(
        `SELECT 
           s.id, 
           s.name, 
           s.created_at, 
           s.updated_at
         FROM stores s
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
      `SELECT COUNT(*)::text as count FROM stores WHERE name ILIKE $1`,
      [pattern]
    )
    const totalCount = parseInt(totalResult.rows[0]?.count || '0', 10)
    const totalPages = Math.ceil(totalCount / limit) || 1

    const queryParams: unknown[] = [pattern]
    let paramIndex = 2
    let matchOrderBy = orderByClause

    // If default sorting, prioritize prefix/exact matches
    if (!rawSortBy && !rawSortOrder) {
      matchOrderBy = `
        CASE
          WHEN lower(s.name) = lower($${paramIndex}) THEN 1
          WHEN lower(s.name) LIKE lower($${paramIndex}) || '%' THEN 2
          ELSE 3
        END,
        s.name ASC
      `
      queryParams.push(q)
      paramIndex++
    }

    const limitPlaceholder = `$${paramIndex++}`
    const offsetPlaceholder = `$${paramIndex++}`
    queryParams.push(limit + 1, offset)

    const result = await pool.query<{ id: number; name: string; created_at: string; updated_at: string }>(
      `SELECT 
         s.id, 
         s.name, 
         s.created_at, 
         s.updated_at
       FROM stores s
       WHERE s.name ILIKE $1
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
    console.error('[DATABASE ERROR] Failed to search stores:', err)
    res.status(500).json({ error: 'Failed to search stores', details })
  }
})

// GET /api/stores/all - Fetch all stores
router.get('/all', async (_req, res) => {
  try {
    const result = await pool.query<{ id: number; name: string }>(
      `SELECT id, name FROM stores ORDER BY name ASC`
    )
    res.json(result.rows)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to fetch all stores:', err)
    res.status(500).json({ error: 'Failed to fetch all stores', details })
  }
})

// POST /api/stores - Create new normalized store
router.post('/', async (req, res) => {
  try {
    const rawName = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!rawName) {
      return res.status(400).json({ error: 'Store name is required' })
    }

    const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    // Check case-insensitive existence first
    const existing = await pool.query<{ id: number; name: string; created_at: string }>(
      `SELECT id, name, created_at FROM stores WHERE lower(name) = lower($1) LIMIT 1`,
      [normalizedName]
    )

    if (existing.rows.length > 0) {
      return res.status(200).json(existing.rows[0])
    }

    const created = await pool.query<{ id: number; name: string; created_at: string }>(
      `INSERT INTO stores (name) VALUES ($1) RETURNING id, name, created_at`,
      [normalizedName]
    )

    res.status(201).json(created.rows[0])
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to create store:', err)
    res.status(500).json({ error: 'Failed to create store', details })
  }
})

// PUT /api/stores/:id - Update existing store name
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid store ID' })
    }

    const rawName = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    if (!rawName) {
      return res.status(400).json({ error: 'Store name cannot be empty' })
    }

    const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    // Check case-insensitive collision with other stores
    const collision = await pool.query<{ id: number }>(
      `SELECT id FROM stores WHERE lower(name) = lower($1) AND id != $2 LIMIT 1`,
      [normalizedName, id]
    )

    if (collision.rows.length > 0) {
      return res.status(409).json({ error: 'A store with this name already exists' })
    }

    const result = await pool.query<{ id: number; name: string; created_at: string; updated_at: string }>(
      `UPDATE stores SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, created_at, updated_at`,
      [normalizedName, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' })
    }

    res.json(result.rows[0])
  } catch (err: unknown) {
    const details = err instanceof Error ? err.stack || err.message : String(err)
    console.error('[DATABASE ERROR] Failed to update store:', err)
    res.status(500).json({ error: 'Failed to update store', details })
  }
})

export default router

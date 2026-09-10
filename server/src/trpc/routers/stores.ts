import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { pool } from '../../db'

export const storesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          q: z.string().optional(),
          page: z.number().optional().default(1),
          pageSize: z.number().optional().default(10),
          limit: z.number().optional(),
          offset: z.number().optional(),
          sortBy: z.string().optional(),
          sortOrder: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const q = input?.q ? input.q.trim() : ''
      const page = Math.max(1, input?.page || 1)
      const limit = Math.max(1, Math.min(100, input?.pageSize || input?.limit || 10))
      const offset = input?.page !== undefined ? (page - 1) * limit : Math.max(0, input?.offset || 0)

      const rawSortBy = input?.sortBy ? input.sortBy.toLowerCase() : ''
      const rawSortOrder = input?.sortOrder ? input.sortOrder.toUpperCase() : ''
      const sortOrder = rawSortOrder === 'DESC' ? 'DESC' : rawSortOrder === 'ASC' ? 'ASC' : ''

      let orderByClause = 's.name ASC'
      if (rawSortBy === 'created_at' || rawSortBy === 'date') {
        orderByClause = `s.created_at ${sortOrder || 'DESC'}, s.name ASC`
      } else if (rawSortBy === 'name') {
        orderByClause = `s.name ${sortOrder || 'ASC'}`
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

        return {
          items,
          totalCount,
          totalPages,
          currentPage: page,
          hasMore,
        }
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

      const limitPlaceholder = `$${paramIndex}`
      const offsetPlaceholder = `$${paramIndex + 1}`
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

      return {
        items,
        totalCount,
        totalPages,
        currentPage: page,
        hasMore,
      }
    }),

  getAll: publicProcedure.query(async () => {
    const result = await pool.query<{ id: number; name: string }>(
      `SELECT id, name FROM stores ORDER BY name ASC`
    )
    return result.rows
  }),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1, 'Store name is required') }))
    .mutation(async ({ input }) => {
      const rawName = input.name.trim()
      const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

      const existing = await pool.query<{ id: number; name: string; created_at: string }>(
        `SELECT id, name, created_at FROM stores WHERE lower(name) = lower($1) LIMIT 1`,
        [normalizedName]
      )

      if (existing.rows.length > 0) {
        return existing.rows[0]
      }

      const created = await pool.query<{ id: number; name: string; created_at: string }>(
        `INSERT INTO stores (name) VALUES ($1) RETURNING id, name, created_at`,
        [normalizedName]
      )

      return created.rows[0]
    }),

  update: publicProcedure
    .input(z.object({ id: z.number(), name: z.string().min(1, 'Store name is required') }))
    .mutation(async ({ input }) => {
      const rawName = input.name.trim()
      const normalizedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

      const collision = await pool.query<{ id: number }>(
        `SELECT id FROM stores WHERE lower(name) = lower($1) AND id != $2 LIMIT 1`,
        [normalizedName, input.id]
      )

      if (collision.rows.length > 0) {
        throw new Error('A store with this name already exists')
      }

      const result = await pool.query<{ id: number; name: string; created_at: string; updated_at: string }>(
        `UPDATE stores SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, created_at, updated_at`,
        [normalizedName, input.id]
      )

      if (result.rows.length === 0) {
        throw new Error('Store not found')
      }

      return result.rows[0]
    }),
})

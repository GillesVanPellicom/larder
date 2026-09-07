import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { config } from '../config'
import * as schema from './schema'

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
})

export const db = drizzle(pool, { schema })

export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const client = await pool.connect()
    try {
      await client.query('SELECT 1')
      return { healthy: true }
    } finally {
      client.release()
    }
  } catch (err: unknown) {
    const errObj = err as { message?: string; code?: string }
    const message = errObj.message || errObj.code || 'Failed to connect to database'
    return { healthy: false, error: message }
  }
}

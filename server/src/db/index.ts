import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { getDatabaseUrl, setPersistentDatabaseUrl, clearPersistentDatabaseUrl } from '../config'
import * as schema from './schema'

let currentPool: Pool | null = null
let currentDb: ReturnType<typeof drizzle> | null = null

export function maskConnectionString(urlStr: string): string {
  if (!urlStr || !urlStr.trim()) return ''
  try {
    const parsed = new URL(urlStr)
    if (parsed.password) {
      parsed.password = '••••••••'
    }
    return parsed.toString()
  } catch {
    return urlStr.replace(/:([^:@/]+)@/, ':••••••••@')
  }
}

export function initDatabasePool(connString?: string): void {
  const url = connString !== undefined ? connString.trim() : getDatabaseUrl().trim()

  if (currentPool) {
    try {
      void currentPool.end()
    } catch {
      // ignore
    }
    currentPool = null
    currentDb = null
  }

  if (!url) {
    return
  }

  try {
    currentPool = new Pool({
      connectionString: url,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    currentPool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err)
    })

    currentDb = drizzle(currentPool, { schema })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Failed to initialize PostgreSQL pool:', msg)
  }
}

// Initialize on module load
initDatabasePool()

export const pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    if (!currentPool) {
      throw new Error('Database is not connected. Please configure your PostgreSQL connection in Settings > Integrations.')
    }
    const val = Reflect.get(currentPool, prop, receiver)
    return typeof val === 'function' ? val.bind(currentPool) : val
  },
})

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop, receiver) {
    if (!currentDb) {
      throw new Error('Database is not connected. Please configure your PostgreSQL connection in Settings > Integrations.')
    }
    return Reflect.get(currentDb, prop, receiver)
  },
})

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  error?: string
  databaseVersion?: string
}> {
  const url = getDatabaseUrl().trim()
  if (!url || !currentPool) {
    return { healthy: false, error: 'No database connection string configured' }
  }

  try {
    const client = await currentPool.connect()
    try {
      const res = await client.query('SELECT version()')
      const version = res.rows[0]?.version || undefined
      return { healthy: true, databaseVersion: version }
    } finally {
      client.release()
    }
  } catch (err: unknown) {
    const errObj = err as { message?: string; code?: string }
    const message = errObj.message || errObj.code || 'Failed to connect to database'
    return { healthy: false, error: message }
  }
}

export function resolveDatabaseUrl(connString?: string): string {
  const input = connString ? connString.trim() : ''
  if (!input) return ''
  if (input.includes('••••••••')) {
    return getDatabaseUrl().trim()
  }
  return input
}

export async function testDatabaseConnection(connString: string): Promise<{
  healthy: boolean
  error?: string
  databaseVersion?: string
}> {
  const resolvedUrl = resolveDatabaseUrl(connString)
  if (!resolvedUrl) {
    return { healthy: false, error: 'Connection string cannot be empty' }
  }

  const testPool = new Pool({
    connectionString: resolvedUrl,
    max: 1,
    connectionTimeoutMillis: 5000,
  })

  try {
    const client = await testPool.connect()
    try {
      const res = await client.query('SELECT version()')
      const version = res.rows[0]?.version || undefined
      return { healthy: true, databaseVersion: version }
    } finally {
      client.release()
    }
  } catch (err: unknown) {
    const errObj = err as { message?: string; code?: string }
    const message = errObj.message || errObj.code || 'Failed to connect to database'
    return { healthy: false, error: message }
  } finally {
    try {
      await testPool.end()
    } catch {
      // ignore
    }
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl().trim())
}

export async function getDatabaseStatus() {
  const url = getDatabaseUrl().trim()
  const isConfigured = Boolean(url)
  const health = isConfigured ? await checkDatabaseHealth() : { healthy: false, error: 'No database connection string configured' }

  return {
    configured: isConfigured,
    connectionStringMasked: isConfigured ? maskConnectionString(url) : '',
    healthy: health.healthy,
    error: health.error,
    databaseVersion: health.databaseVersion,
  }
}

export function disconnectDatabase(): void {
  clearPersistentDatabaseUrl()
  initDatabasePool('')
}

export function saveDatabaseUrl(url: string): void {
  const resolvedUrl = resolveDatabaseUrl(url)
  setPersistentDatabaseUrl(resolvedUrl)
  initDatabasePool(resolvedUrl)
}


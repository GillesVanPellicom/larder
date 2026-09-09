import { Router } from 'express'
import {
  getDatabaseStatus,
  testDatabaseConnection,
  saveDatabaseUrl,
  disconnectDatabase,
} from '../db'
import { migrateDb } from '../db/migrate'

const router = Router()

// GET /api/database/config
router.get('/config', async (_req, res) => {
  try {
    const status = await getDatabaseStatus()
    res.json(status)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ configured: false, healthy: false, error: details })
  }
})

// POST /api/database/test
router.post('/test', async (req, res) => {
  try {
    const { connectionString } = req.body as { connectionString?: string }
    if (!connectionString || !connectionString.trim()) {
      return res.status(400).json({ healthy: false, error: 'Connection string is required' })
    }

    const result = await testDatabaseConnection(connectionString)
    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ healthy: false, error: details })
  }
})

// POST /api/database/config
router.post('/config', async (req, res) => {
  try {
    const { connectionString } = req.body as { connectionString?: string }
    if (!connectionString || !connectionString.trim()) {
      return res.status(400).json({ error: 'Connection string is required' })
    }

    // 1. Test connection first
    const testResult = await testDatabaseConnection(connectionString)
    if (!testResult.healthy) {
      return res.status(400).json({
        error: testResult.error || 'Failed to connect to the specified database',
      })
    }

    // 2. Save and switch active pool
    saveDatabaseUrl(connectionString)

    // 3. Migrate database tables/schema
    try {
      await migrateDb(3, 1000)
    } catch (migErr: unknown) {
      const migMsg = migErr instanceof Error ? migErr.message : String(migErr)
      console.warn('[Database] Migration failed after connection:', migMsg)
    }

    const status = await getDatabaseStatus()
    res.json({ success: true, ...status })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: details })
  }
})

// DELETE /api/database/config
router.delete('/config', async (_req, res) => {
  try {
    disconnectDatabase()
    const status = await getDatabaseStatus()
    res.json({ success: true, ...status })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: details })
  }
})

export default router

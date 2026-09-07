import { Router } from 'express'
import { checkDatabaseHealth } from '../db'
import type { HealthCheckResponse } from '../../../shared/types'

const router = Router()
const startTime = Date.now()

router.get('/', async (_req, res) => {
  const dbHealth = await checkDatabaseHealth()
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000)

  const response: HealthCheckResponse = {
    status: dbHealth.healthy ? 'healthy' : 'unhealthy',
    database: dbHealth.healthy ? 'connected' : 'disconnected',
    error: dbHealth.error,
    uptimeSeconds,
    timestamp: new Date().toISOString(),
  }

  const statusCode = dbHealth.healthy ? 200 : 503
  res.status(statusCode).json(response)
})

export default router

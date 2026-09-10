import { publicProcedure, router } from '../trpc'
import { getDatabaseStatus } from '../../db'
import type { HealthCheckResponse } from '../../../../shared/types'

export const healthRouter = router({
  check: publicProcedure.query(async (): Promise<HealthCheckResponse> => {
    const dbStatus = await getDatabaseStatus()
    const isHealthy = dbStatus.healthy

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: isHealthy ? 'connected' : 'disconnected',
      error: dbStatus.error,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    }
  }),
})

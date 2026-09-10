import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import {
  getDatabaseStatus,
  testDatabaseConnection,
  saveDatabaseUrl,
  disconnectDatabase,
} from '../../db'
import { migrateDb } from '../../db/migrate'

export const databaseRouter = router({
  getConfig: publicProcedure.query(async () => {
    return await getDatabaseStatus()
  }),

  testConnection: publicProcedure
    .input(z.object({ connectionString: z.string().min(1, 'Connection string is required') }))
    .mutation(async ({ input }) => {
      return await testDatabaseConnection(input.connectionString)
    }),

  saveConfig: publicProcedure
    .input(z.object({ connectionString: z.string().min(1, 'Connection string is required') }))
    .mutation(async ({ input }) => {
      const testResult = await testDatabaseConnection(input.connectionString)
      if (!testResult.healthy) {
        throw new Error(testResult.error || 'Failed to connect to the specified database')
      }

      saveDatabaseUrl(input.connectionString)

      try {
        await migrateDb(3, 1000)
      } catch (migErr: unknown) {
        const migMsg = migErr instanceof Error ? migErr.message : String(migErr)
        console.warn('[Database] Migration failed after connection:', migMsg)
      }

      const status = await getDatabaseStatus()
      return { success: true, ...status }
    }),

  disconnect: publicProcedure.mutation(async () => {
    disconnectDatabase()
    const status = await getDatabaseStatus()
    return { success: true, ...status }
  }),
})

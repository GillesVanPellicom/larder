import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { router, publicProcedure } from '../trpc'
import { storageService } from '../../services/storageService'

const storageConfigSchema = z.object({
  endpoint: z.string().optional(),
  region: z.string().optional(),
  bucket: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  publicUrlPrefix: z.string().optional(),
  forcePathStyle: z.boolean().optional(),
})

export const storageRouter = router({
  getStatus: publicProcedure.query(async () => {
    try {
      return storageService.getStatus()
    } catch (err: unknown) {
      console.error('[tRPC ERROR] Failed to get storage status:', err)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Failed to retrieve storage status',
      })
    }
  }),

  testConnection: publicProcedure
    .input(storageConfigSchema.optional())
    .mutation(async ({ input }) => {
      try {
        const result = await storageService.testConnection(input)
        return result
      } catch (err: unknown) {
        console.error('[tRPC ERROR] Storage test failed:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Storage connection test failed',
        })
      }
    }),

  saveConfig: publicProcedure
    .input(storageConfigSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await storageService.saveConfig(input)
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Failed to save storage configuration',
          })
        }
        const status = storageService.getStatus()
        return { success: true, ...status }
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err
        console.error('[tRPC ERROR] Failed to save storage config:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to save storage configuration',
        })
      }
    }),

  disconnect: publicProcedure.mutation(async () => {
    try {
      storageService.disconnect()
      const status = storageService.getStatus()
      return { success: true, ...status }
    } catch (err: unknown) {
      console.error('[tRPC ERROR] Failed to disconnect storage:', err)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err instanceof Error ? err.message : 'Failed to disconnect storage',
      })
    }
  }),

  upload: publicProcedure
    .input(
      z.object({
        base64: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64Data, 'base64')
        if (buffer.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid base64 image data',
          })
        }
        const uploaded = await storageService.uploadImage(buffer)
        return uploaded
      } catch (err: unknown) {
        if (err instanceof TRPCError) throw err
        console.error('[tRPC ERROR] Failed to upload image:', err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Failed to upload image',
        })
      }
    }),
})

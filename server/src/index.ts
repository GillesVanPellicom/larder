import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import * as trpcExpress from '@trpc/server/adapters/express'
import { config } from './config'
import { migrateDb } from './db/migrate'
import { appRouter, createContext } from './trpc'
import imagesRouter from './routes/images'

const app = express()

// Global middleware
app.use(cors())
app.use(express.json({ limit: '25mb' }))

// tRPC API endpoint
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
)

// Binary Image Streaming routes for browser <img src="..."> tags
app.use('/api/storage', imagesRouter)
app.use('/api/images', imagesRouter)

// In production or when client build exists, serve static React frontend
if (fs.existsSync(config.clientDistPath)) {
  console.log(`[Server] Serving static client build from ${config.clientDistPath}`)
  app.use(express.static(config.clientDistPath))

  // Fallback to index.html for SPA routing (excluding /api routes)
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next()
    }
    res.sendFile(path.join(config.clientDistPath, 'index.html'))
  })
}

// Global API error handler ensuring all errors are logged to server console
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const msg = err instanceof Error ? err.stack || err.message : String(err)
  console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, msg)
  if (res.headersSent) {
    return
  }
  res.status(500).json({
    error: 'Internal server error',
    details: err instanceof Error ? err.message : String(err),
  })
})

async function startServer() {
  try {
    // Attempt schema migration with Drizzle ORM
    await migrateDb().catch((err) => {
      console.warn('[Server] Initial DB migration failed, server will continue startup:', err.message)
    })

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`[Server] Larder backend is listening on http://0.0.0.0:${config.port}`)
      console.log(`[Server] Environment: ${config.nodeEnv}`)
    })
  } catch (err) {
    console.error('[Server] Fatal startup error:', err)
    process.exit(1)
  }
}

startServer()

import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { migrateDb } from './db/migrate'
import healthRouter from './routes/health'
import databaseRouter from './routes/database'
import storageRouter from './routes/storage'
import recipesRouter from './routes/recipes'
import configRouter from './routes/config'
import tagsRouter from './routes/tags'
import conflictsRouter from './routes/conflicts'
import templatesRouter from './routes/templates'

const app = express()

// Global middleware
app.use(cors())
app.use(express.json())

// API routes
app.use('/api/health', healthRouter)
app.use('/api/database', databaseRouter)
app.use('/api/storage', storageRouter)
app.use('/api/images', storageRouter)
app.use('/api/config', configRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/conflicts', conflictsRouter)
app.use('/api/templates', templatesRouter)
app.use('/api/recipes', recipesRouter)

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

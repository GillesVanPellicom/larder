import { Router } from 'express'
import express from 'express'
import { Readable } from 'node:stream'
import { storageService } from '../services/storageService'
import type { StorageConfigDTO } from '../../../shared/types'

const router = Router()

// GET /api/storage/config
router.get('/config', (_req, res) => {
  try {
    const status = storageService.getStatus()
    res.json(status)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: details })
  }
})

// POST /api/storage/test
router.post('/test', async (req, res) => {
  try {
    const result = await storageService.testConnection(req.body as StorageConfigDTO)
    res.json(result)
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ success: false, error: details })
  }
})

// POST /api/storage/config
router.post('/config', async (req, res) => {
  try {
    const result = await storageService.saveConfig(req.body as StorageConfigDTO)
    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }
    const status = storageService.getStatus()
    res.json({ success: true, ...status })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: details })
  }
})

// DELETE /api/storage/config
router.delete('/config', (_req, res) => {
  try {
    storageService.disconnect()
    const status = storageService.getStatus()
    res.json({ success: true, ...status })
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: details })
  }
})

// POST /api/images/upload
// Supports raw binary image upload with up to 25MB body
router.post(
  '/upload',
  express.raw({ type: ['image/*', 'application/octet-stream'], limit: '25mb' }),
  async (req, res) => {
    try {
      let buffer: Buffer | null = null

      if (Buffer.isBuffer(req.body)) {
        buffer = req.body
      } else if (req.body && typeof req.body === 'object' && req.body.base64) {
        // Base64 fallback if JSON passed
        const base64Data = req.body.base64.replace(/^data:image\/\w+;base64,/, '')
        buffer = Buffer.from(base64Data, 'base64')
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'No image data received in upload payload' })
      }

      const uploaded = await storageService.uploadImage(buffer)
      res.json(uploaded)
    } catch (err: unknown) {
      const details = err instanceof Error ? err.message : String(err)
      console.error('Image upload failed:', details)
      res.status(500).json({ error: details })
    }
  }
)

async function handleGetImage(req: express.Request, res: express.Response) {
  try {
    const rawKey = req.params.key
    const key = (Array.isArray(rawKey) ? rawKey[0] : rawKey) || ''
    if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
      return res.status(400).json({ error: 'Invalid image key' })
    }

    const image = await storageService.getImage(key)
    if (!image) {
      return res.status(404).json({ error: 'Image not found' })
    }

    res.setHeader('Content-Type', image.contentType || 'image/webp')
    if (image.contentLength) {
      res.setHeader('Content-Length', image.contentLength)
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

    if (image.body instanceof Readable || (image.body && typeof (image.body as Readable).pipe === 'function')) {
      (image.body as Readable).pipe(res)
    } else if (
      image.body &&
      typeof (image.body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function'
    ) {
      const bytes = await (image.body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray()
      res.end(Buffer.from(bytes))
    } else {
      res.end(image.body)
    }
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: details })
  }
}

// GET /api/storage/images/:key
router.get('/images/:key', handleGetImage)

// GET /api/images/:key (fallback when mounted at /api/images)
router.get('/:key', (req, res, next) => {
  if (['config', 'test', 'upload'].includes(req.params.key)) {
    return next()
  }
  return handleGetImage(req, res)
})

export default router

import { Router } from 'express'
import type { Request, Response } from 'express'
import { Readable } from 'node:stream'
import { storageService } from '../services/storageService'

const router = Router()

async function handleGetImage(req: Request, res: Response) {
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

// GET /api/images/:key
router.get('/:key', handleGetImage)

export default router

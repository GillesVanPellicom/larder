import crypto from 'node:crypto'
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import {
  getStorageConfig,
  setPersistentStorageConfig,
  clearPersistentStorageConfig,
} from '../config'
import type { StorageConfig, StorageConfigDTO, UploadImageResponse } from '../../../shared/types'

/**
 * Standard RFC 9562 UUIDv7 generator.
 * Combines 48-bit millisecond timestamp with cryptographically random bits.
 */
export function generateUuidV7(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  const timestamp = Date.now()
  bytes[0] = Math.floor(timestamp / 281474976710656) & 0xff
  bytes[1] = Math.floor(timestamp / 1099511627776) & 0xff
  bytes[2] = Math.floor(timestamp / 4294967296) & 0xff
  bytes[3] = Math.floor(timestamp / 16777216) & 0xff
  bytes[4] = Math.floor(timestamp / 65536) & 0xff
  bytes[5] = Math.floor(timestamp / 256) & 0xff
  bytes[6] = (bytes[6] & 0x0f) | 0x70 // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function maskSecret(secret?: string): string {
  if (!secret) return ''
  if (secret.length <= 6) return '••••••••'
  return `${secret.slice(0, 3)}••••••••${secret.slice(-3)}`
}

function formatStorageError(err: unknown, bucket?: string, endpoint?: string): string {
  if (!err) return 'Unknown error occurred while contacting object storage'

  const errObj = err as {
    name?: string
    message?: string
    code?: string
    Code?: string
    $fault?: string
    $metadata?: { httpStatusCode?: number }
    $response?: { statusCode?: number }
  }

  const statusCode = errObj.$metadata?.httpStatusCode || errObj.$response?.statusCode

  if (statusCode === 403) {
    return `Access Denied (403 Forbidden): Invalid Access Key ID / Secret Access Key, or insufficient permissions for bucket "${bucket || ''}".`
  }
  if (statusCode === 404) {
    return `Bucket Not Found (404): The bucket "${bucket || ''}" was not found on this endpoint.`
  }
  if (statusCode === 301) {
    return `Permanent Redirect (301): The bucket "${bucket || ''}" is located in a different region. Check your region setting.`
  }
  if (statusCode === 400) {
    return `Bad Request (400): Unable to access bucket "${bucket || ''}". Verify the endpoint URL, region, and path style settings.`
  }

  if (errObj.code === 'ENOTFOUND' || errObj.code === 'EAI_AGAIN') {
    return `Host not found (${errObj.code}): Could not resolve endpoint host "${endpoint || ''}". Check the endpoint URL.`
  }
  if (errObj.code === 'ECONNREFUSED') {
    return `Connection refused (${errObj.code}): Could not connect to endpoint "${endpoint || ''}".`
  }

  const baseMsg = errObj.message || errObj.name || String(err)
  if (baseMsg === 'UnknownError' && statusCode) {
    return `Storage request failed with HTTP ${statusCode}.`
  }
  if (baseMsg && baseMsg !== 'UnknownError') {
    return baseMsg
  }

  return `Failed to connect to storage (HTTP ${statusCode || 'unknown'}). Check your endpoint, credentials, and bucket configuration.`
}

function createS3Client(config: StorageConfigDTO): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region || 'auto',
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: config.forcePathStyle ?? false,
  })
}

export class StorageService {
  public getStatus(): StorageConfig {
    const conf = getStorageConfig()
    if (!conf) {
      return { configured: false }
    }

    return {
      configured: true,
      endpoint: conf.endpoint,
      region: conf.region,
      bucket: conf.bucket,
      accessKeyId: conf.accessKeyId,
      secretAccessKeyMasked: maskSecret(conf.secretAccessKey),
      publicUrlPrefix: conf.publicUrlPrefix,
      forcePathStyle: conf.forcePathStyle,
    }
  }

  private resolveStorageConfig(customConfig?: StorageConfigDTO): StorageConfigDTO | null {
    const saved = getStorageConfig()
    if (!customConfig) {
      return saved
    }

    const endpoint = customConfig.endpoint?.trim() || saved?.endpoint || ''
    const bucket = customConfig.bucket?.trim() || saved?.bucket || ''
    const region = customConfig.region?.trim() || saved?.region || 'auto'
    const accessKeyId =
      customConfig.accessKeyId !== undefined && customConfig.accessKeyId !== ''
        ? customConfig.accessKeyId.trim()
        : saved?.accessKeyId || ''

    let secretAccessKey =
      customConfig.secretAccessKey !== undefined && customConfig.secretAccessKey !== ''
        ? customConfig.secretAccessKey.trim()
        : ''

    // If secretAccessKey contains masking characters or is empty, fallback to the existing saved secret
    if (!secretAccessKey || /[•\u2022\u25cf*]/.test(secretAccessKey)) {
      secretAccessKey = saved?.secretAccessKey || ''
    }

    const publicUrlPrefix =
      customConfig.publicUrlPrefix !== undefined && customConfig.publicUrlPrefix !== ''
        ? customConfig.publicUrlPrefix.trim()
        : saved?.publicUrlPrefix || endpoint

    const forcePathStyle =
      customConfig.forcePathStyle !== undefined
        ? Boolean(customConfig.forcePathStyle)
        : saved?.forcePathStyle ?? false

    if (!endpoint || !bucket) {
      return null
    }

    return {
      endpoint,
      region,
      bucket,
      accessKeyId,
      secretAccessKey,
      publicUrlPrefix,
      forcePathStyle,
    }
  }

  public async testConnection(customConfig?: StorageConfigDTO): Promise<{ success: boolean; error?: string }> {
    const conf = this.resolveStorageConfig(customConfig)
    if (!conf || !conf.endpoint || !conf.bucket) {
      return { success: false, error: 'Incomplete S3 storage configuration (endpoint and bucket name required)' }
    }

    try {
      const client = createS3Client(conf)
      // HeadBucket verifies bucket reachability & credentials
      try {
        await client.send(new HeadBucketCommand({ Bucket: conf.bucket }))
        return { success: true }
      } catch (headErr: unknown) {
        // Fallback to ListObjectsV2 in case HeadBucket permissions are restricted
        try {
          await client.send(new ListObjectsV2Command({ Bucket: conf.bucket, MaxKeys: 1 }))
          return { success: true }
        } catch {
          throw headErr
        }
      }
    } catch (err: unknown) {
      const msg = formatStorageError(err, conf.bucket, conf.endpoint)
      return { success: false, error: msg }
    }
  }

  public async saveConfig(newConfig: StorageConfigDTO): Promise<{ success: boolean; error?: string }> {
    const resolved = this.resolveStorageConfig(newConfig)
    if (!resolved || !resolved.endpoint || !resolved.bucket) {
      return { success: false, error: 'Endpoint and Bucket name are required' }
    }

    // 1. Test connection first
    const test = await this.testConnection(resolved)
    if (!test.success) {
      return { success: false, error: test.error || 'Failed to connect to S3 storage bucket' }
    }

    // 2. Persist
    setPersistentStorageConfig({
      endpoint: resolved.endpoint,
      region: resolved.region,
      bucket: resolved.bucket,
      accessKeyId: resolved.accessKeyId,
      secretAccessKey: resolved.secretAccessKey,
      publicUrlPrefix: resolved.publicUrlPrefix,
      forcePathStyle: resolved.forcePathStyle,
    })

    return { success: true }
  }

  public disconnect(): void {
    clearPersistentStorageConfig()
  }

  public async getImage(key: string): Promise<{ body: unknown; contentType?: string; contentLength?: number } | null> {
    const conf = getStorageConfig()
    if (!conf) return null

    try {
      const client = createS3Client(conf)
      const res = await client.send(
        new GetObjectCommand({
          Bucket: conf.bucket,
          Key: key,
        })
      )
      if (!res.Body) return null

      return {
        body: res.Body,
        contentType: res.ContentType || 'image/webp',
        contentLength: res.ContentLength,
      }
    } catch {
      return null
    }
  }

  public async uploadImage(buffer: Buffer): Promise<UploadImageResponse> {
    const conf = getStorageConfig()
    if (!conf) {
      throw new Error('S3 object storage is not configured. Please configure it in Settings > Integrations.')
    }

    // Generate UUIDv7 filename with webp extension
    const uuid = generateUuidV7()
    const filename = `${uuid}.webp`

    const client = createS3Client(conf)

    await client.send(
      new PutObjectCommand({
        Bucket: conf.bucket,
        Key: filename,
        Body: buffer,
        ContentType: 'image/webp',
      })
    )

    // If publicUrlPrefix is set to a public domain / CDN (and not the private API endpoint), use it.
    // Otherwise, route through the backend proxy /api/storage/images/:key so it works automatically.
    const isS3ApiEndpoint = Boolean(
      !conf.publicUrlPrefix ||
      conf.publicUrlPrefix.includes('.r2.cloudflarestorage.com') ||
      conf.publicUrlPrefix.includes('.amazonaws.com')
    )

    let publicUrl: string
    if (isS3ApiEndpoint) {
      publicUrl = `/api/storage/images/${filename}`
    } else {
      const prefix = conf.publicUrlPrefix.replace(/\/$/, '')
      publicUrl = `${prefix}/${filename}`
    }

    return {
      url: publicUrl,
      key: filename,
      sizeBytes: buffer.length,
      contentType: 'image/webp',
    }
  }
}

export const storageService = new StorageService()

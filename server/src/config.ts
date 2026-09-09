import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'
import type { StorageConfigDTO } from '../../shared/types'

const ENV_FILE_PATH = path.resolve(process.cwd(), '.env')

// Load environment variables
dotenv.config()

/**
 * Helper to update key-value pairs in the local .env file.
 */
function updateEnvFile(updates: Record<string, string | null>): void {
  try {
    let content = ''
    if (fs.existsSync(ENV_FILE_PATH)) {
      content = fs.readFileSync(ENV_FILE_PATH, 'utf-8')
    }

    const lines = content.split('\n')
    const seenKeys = new Set<string>()

    const newLines = lines
      .map((line) => {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=(.*)$/)
        if (match) {
          const key = match[1]
          if (key in updates) {
            seenKeys.add(key)
            const val = updates[key]
            if (val === null) {
              return null
            }
            return `${key}=${val}`
          }
        }
        return line
      })
      .filter((line): line is string => line !== null)

    // Append newly added keys that were not present in existing lines
    for (const [key, val] of Object.entries(updates)) {
      if (!seenKeys.has(key) && val !== null) {
        newLines.push(`${key}=${val}`)
      }
    }

    fs.writeFileSync(ENV_FILE_PATH, newLines.join('\n').trim() + '\n', 'utf-8')
  } catch (err) {
    console.error('[Config] Failed to update .env file:', err)
  }
}

export function getDatabaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    'postgresql://larder:larder_secret@localhost:5432/larder'
  )
}

export function setPersistentDatabaseUrl(url: string): void {
  const trimmed = url.trim()
  process.env.DATABASE_URL = trimmed
  updateEnvFile({ DATABASE_URL: trimmed })
}

export function clearPersistentDatabaseUrl(): void {
  process.env.DATABASE_URL = ''
  updateEnvFile({ DATABASE_URL: '' })
}

export function getStorageConfig(): StorageConfigDTO | null {
  if (process.env.S3_ENDPOINT && process.env.S3_BUCKET) {
    return {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      bucket: process.env.S3_BUCKET,
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      publicUrlPrefix: process.env.S3_PUBLIC_URL_PREFIX || '',
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    }
  }
  return null
}

export function setPersistentStorageConfig(storage: StorageConfigDTO): void {
  process.env.S3_ENDPOINT = storage.endpoint
  process.env.S3_REGION = storage.region || 'auto'
  process.env.S3_BUCKET = storage.bucket
  process.env.S3_ACCESS_KEY_ID = storage.accessKeyId
  process.env.S3_SECRET_ACCESS_KEY = storage.secretAccessKey
  process.env.S3_PUBLIC_URL_PREFIX = storage.publicUrlPrefix || ''
  process.env.S3_FORCE_PATH_STYLE = String(storage.forcePathStyle ?? false)

  updateEnvFile({
    S3_ENDPOINT: storage.endpoint,
    S3_REGION: storage.region || 'auto',
    S3_BUCKET: storage.bucket,
    S3_ACCESS_KEY_ID: storage.accessKeyId,
    S3_SECRET_ACCESS_KEY: storage.secretAccessKey,
    S3_PUBLIC_URL_PREFIX: storage.publicUrlPrefix || '',
    S3_FORCE_PATH_STYLE: String(storage.forcePathStyle ?? false),
  })
}

export function clearPersistentStorageConfig(): void {
  delete process.env.S3_ENDPOINT
  delete process.env.S3_REGION
  delete process.env.S3_BUCKET
  delete process.env.S3_ACCESS_KEY_ID
  delete process.env.S3_SECRET_ACCESS_KEY
  delete process.env.S3_PUBLIC_URL_PREFIX
  delete process.env.S3_FORCE_PATH_STYLE

  updateEnvFile({
    S3_ENDPOINT: null,
    S3_REGION: null,
    S3_BUCKET: null,
    S3_ACCESS_KEY_ID: null,
    S3_SECRET_ACCESS_KEY: null,
    S3_PUBLIC_URL_PREFIX: null,
    S3_FORCE_PATH_STYLE: null,
  })
}

export const config = {
  port: Number(process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001)),
  nodeEnv: process.env.NODE_ENV || 'development',
  get databaseUrl() {
    return getDatabaseUrl()
  },
  clientDistPath: path.resolve(process.cwd(), 'dist'),
}

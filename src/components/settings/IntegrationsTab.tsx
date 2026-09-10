import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import { databaseApi, storageApi } from '@/services/api'
import type { DatabaseConfig, StorageConfig } from '@/shared/types'
import {
  Check,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react'

export function IntegrationsTab() {
  // 1. Database Connection State
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null)
  const [connStringInput, setConnStringInput] = useState('')
  const [showDbPassword, setShowDbPassword] = useState(true)
  const [dbLoading, setDbLoading] = useState(true)
  const [dbTesting, setDbTesting] = useState(false)
  const [dbSaving, setDbSaving] = useState(false)
  const [dbDisconnecting, setDbDisconnecting] = useState(false)
  const [dbStatusMessage, setDbStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // 2. S3 Object Storage State
  const [storageConfig, setStorageConfig] = useState<StorageConfig | null>(null)
  const [endpoint, setEndpoint] = useState('')
  const [region, setRegion] = useState('auto')
  const [bucket, setBucket] = useState('')
  const [accessKeyId, setAccessKeyId] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [publicUrlPrefix, setPublicUrlPrefix] = useState('')
  const [forcePathStyle, setForcePathStyle] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [storageLoading, setStorageLoading] = useState(true)
  const [storageTesting, setStorageTesting] = useState(false)
  const [storageSaving, setStorageSaving] = useState(false)
  const [storageDisconnecting, setStorageDisconnecting] = useState(false)
  const [storageStatusMessage, setStorageStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const loadAllConfigs = useCallback(async () => {
    try {
      setDbLoading(true)
      setStorageLoading(true)
      const [dbData, s3Data] = await Promise.all([
        databaseApi.getConfig(),
        storageApi.getConfig(),
      ])

      setDbConfig(dbData)
      if (dbData.connectionStringMasked) {
        setConnStringInput(dbData.connectionStringMasked)
      }

      setStorageConfig(s3Data)
      if (s3Data.configured) {
        setEndpoint(s3Data.endpoint || '')
        setRegion(s3Data.region || 'auto')
        setBucket(s3Data.bucket || '')
        setAccessKeyId(s3Data.accessKeyId || '')
        setSecretAccessKey(s3Data.secretAccessKeyMasked || '')
        setPublicUrlPrefix(s3Data.publicUrlPrefix || '')
        setForcePathStyle(Boolean(s3Data.forcePathStyle))
      }
    } catch (err) {
      console.error('Failed to load integrations configuration:', err)
    } finally {
      setDbLoading(false)
      setStorageLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAllConfigs()
  }, [loadAllConfigs])

  // Database Handlers
  const handleTestDatabase = async () => {
    if (!connStringInput.trim()) {
      setDbStatusMessage({ type: 'error', text: 'Please enter a connection string to test' })
      return
    }
    setDbTesting(true)
    setDbStatusMessage(null)
    try {
      const res = await databaseApi.testConnection(connStringInput.trim())
      if (res.healthy) {
        setDbStatusMessage({
          type: 'success',
          text: `Successfully connected to PostgreSQL${res.databaseVersion ? ` (${res.databaseVersion.split(',')[0]})` : ''}`,
        })
      } else {
        setDbStatusMessage({
          type: 'error',
          text: res.error || 'Failed to connect to database',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection test failed'
      setDbStatusMessage({ type: 'error', text: msg })
    } finally {
      setDbTesting(false)
    }
  }

  const handleSaveDatabase = async () => {
    if (!connStringInput.trim()) {
      setDbStatusMessage({ type: 'error', text: 'Please enter a connection string' })
      return
    }
    setDbSaving(true)
    setDbStatusMessage(null)
    try {
      const res = await databaseApi.saveConfig(connStringInput.trim())
      if (res.healthy) {
        setDbConfig({
          configured: res.configured,
          connectionStringMasked: res.connectionStringMasked,
          healthy: res.healthy,
          databaseVersion: res.databaseVersion,
        })
        setConnStringInput(res.connectionStringMasked)
        setDbStatusMessage({ type: 'success', text: 'Database connected and schema initialized' })
      } else {
        setDbStatusMessage({
          type: 'error',
          text: res.error || 'Failed to save and connect to database',
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save database connection'
      setDbStatusMessage({ type: 'error', text: msg })
    } finally {
      setDbSaving(false)
    }
  }

  const handleDisconnectDatabase = async () => {
    setDbDisconnecting(true)
    setDbStatusMessage(null)
    try {
      const res = await databaseApi.disconnect()
      setDbConfig({
        configured: res.configured,
        connectionStringMasked: '',
        healthy: false,
      })
      setConnStringInput('')
      setDbStatusMessage({ type: 'success', text: 'Database disconnected' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect database'
      setDbStatusMessage({ type: 'error', text: msg })
    } finally {
      setDbDisconnecting(false)
    }
  }

  // S3 Storage Handlers
  const handleTestStorage = async () => {
    if (!endpoint.trim() || !bucket.trim()) {
      setStorageStatusMessage({ type: 'error', text: 'Endpoint and Bucket name are required' })
      return
    }
    setStorageTesting(true)
    setStorageStatusMessage(null)
    try {
      const res = await storageApi.testConnection({
        endpoint: endpoint.trim(),
        region: region.trim() || 'auto',
        bucket: bucket.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        publicUrlPrefix: publicUrlPrefix.trim() || endpoint.trim(),
        forcePathStyle,
      })

      if (res.success) {
        setStorageStatusMessage({ type: 'success', text: 'Successfully connected to S3 object storage bucket' })
      } else {
        setStorageStatusMessage({ type: 'error', text: res.error || 'Failed to connect to S3 storage bucket' })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Storage test failed'
      setStorageStatusMessage({ type: 'error', text: msg })
    } finally {
      setStorageTesting(false)
    }
  }

  const handleSaveStorage = async () => {
    if (!endpoint.trim() || !bucket.trim()) {
      setStorageStatusMessage({ type: 'error', text: 'Endpoint and Bucket name are required' })
      return
    }
    setStorageSaving(true)
    setStorageStatusMessage(null)
    try {
      const res = await storageApi.saveConfig({
        endpoint: endpoint.trim(),
        region: region.trim() || 'auto',
        bucket: bucket.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        publicUrlPrefix: publicUrlPrefix.trim() || endpoint.trim(),
        forcePathStyle,
      })

      if (res.success) {
        setStorageConfig({
          configured: true,
          endpoint: endpoint.trim(),
          region: region.trim() || 'auto',
          bucket: bucket.trim(),
          accessKeyId: accessKeyId.trim(),
          publicUrlPrefix: publicUrlPrefix.trim() || endpoint.trim(),
          forcePathStyle,
        })
        setStorageStatusMessage({ type: 'success', text: 'S3 cloud storage connected and saved' })
      } else {
        setStorageStatusMessage({ type: 'error', text: res.error || 'Failed to save S3 configuration' })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save S3 storage configuration'
      setStorageStatusMessage({ type: 'error', text: msg })
    } finally {
      setStorageSaving(false)
    }
  }

  const handleDisconnectStorage = async () => {
    setStorageDisconnecting(true)
    setStorageStatusMessage(null)
    try {
      await storageApi.disconnect()
      setStorageConfig({ configured: false })
      setEndpoint('')
      setRegion('auto')
      setBucket('')
      setAccessKeyId('')
      setSecretAccessKey('')
      setPublicUrlPrefix('')
      setForcePathStyle(false)
      setStorageStatusMessage({ type: 'success', text: 'S3 storage disconnected' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect storage'
      setStorageStatusMessage({ type: 'error', text: msg })
    } finally {
      setStorageDisconnecting(false)
    }
  }

  const isDbConnected = Boolean(dbConfig?.configured && dbConfig?.healthy)
  const isStorageConnected = Boolean(storageConfig?.configured)

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-150">
      {/* 1. Database Connection Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              Database
            </h2>
            <InfoTooltip content="PostgreSQL 15+ (tested with PostgreSQL 16 & 18). Requires schema permissions to create tables and sequences. Format: postgresql://user:password@host:port/dbname" />
          </div>

          <div className="flex items-center gap-2">
            {dbLoading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking
              </span>
            ) : isDbConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            ) : dbConfig?.configured ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {dbStatusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
              dbStatusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {dbStatusMessage.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{dbStatusMessage.text}</span>
          </div>
        )}

        {/* Database Connection Input */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-foreground">
                Connection String
              </label>
              <InfoTooltip content="Standard PostgreSQL connection URI (e.g. postgresql://user:password@localhost:5432/larder?sslmode=verify-full). Applied globally across all app users." />
            </div>
            <div className="relative">
              <Input
                type={showDbPassword ? 'text' : 'password'}
                value={connStringInput}
                onChange={(e) => setConnStringInput(e.target.value)}
                placeholder="postgresql://user:password@localhost:5432/larder"
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowDbPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title={showDbPassword ? 'Hide characters' : 'Show characters'}
              >
                {showDbPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestDatabase}
              disabled={dbTesting || dbSaving || dbDisconnecting}
              className="cursor-pointer gap-1.5"
            >
              {dbTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Test</span>
            </Button>

            {dbConfig?.configured && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectDatabase}
                disabled={dbTesting || dbSaving || dbDisconnecting}
                className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {dbDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Disconnect</span>
              </Button>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleSaveDatabase}
            disabled={dbTesting || dbSaving || dbDisconnecting}
            className="cursor-pointer gap-1.5 bg-primary text-primary-foreground"
          >
            {dbSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* 2. S3 Object Storage Card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              Object Storage
            </h2>
            <InfoTooltip content="S3-compatible cloud storage (Cloudflare R2, AWS S3, MinIO, Backblaze B2, Supabase Storage) for uploading recipe cover images. Images are automatically compressed to WebP and named with a UUIDv7." />
          </div>

          <div className="flex items-center gap-2">
            {storageLoading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking
              </span>
            ) : isStorageConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {storageStatusMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
              storageStatusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}
          >
            {storageStatusMessage.type === 'success' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="flex-1">{storageStatusMessage.text}</span>
          </div>
        )}

        {/* S3 Configuration Fields */}
        <div className="space-y-4">
          {/* Endpoint */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-foreground">
                S3 Endpoint
              </label>
              <InfoTooltip content="S3-compatible endpoint URI (e.g. https://<account_id>.r2.cloudflarestorage.com or https://s3.us-east-1.amazonaws.com)." />
            </div>
            <Input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://<account_id>.r2.cloudflarestorage.com"
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bucket Name */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Bucket Name
                </label>
                <InfoTooltip content="Name of your object storage bucket (e.g. larder-images)." />
              </div>
              <Input
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="larder-images"
                className="font-mono text-xs"
              />
            </div>

            {/* Region */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Region
                </label>
                <InfoTooltip content="Bucket region (use 'auto' for Cloudflare R2, 'us-east-1' for standard AWS, etc.)." />
              </div>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="auto"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Access Key ID */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Access Key ID
                </label>
                <InfoTooltip content="S3 or R2 Access Key ID credentials with PutObject permissions." />
              </div>
              <Input
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                placeholder="xxxx..."
                className="font-mono text-xs"
              />
            </div>

            {/* Secret Access Key */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Secret Access Key
                </label>
                <InfoTooltip content="S3 Secret Access Key credentials." />
              </div>
              <div className="relative">
                <Input
                  type={showSecretKey ? 'text' : 'password'}
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder="xxxx..."
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title={showSecretKey ? 'Hide characters' : 'Show characters'}
                >
                  {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Public Access URL Prefix */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-foreground">
                Public Access URL Prefix
              </label>
              <InfoTooltip content="Optional. If you enabled a public bucket domain or CDN (e.g. https://pub-xxxx.r2.dev or https://images.yourdomain.com), enter it here. If left blank, images are automatically served securely through the app's backend proxy (/api/storage/images)." />
            </div>
            <Input
              value={publicUrlPrefix}
              onChange={(e) => setPublicUrlPrefix(e.target.value)}
              placeholder="https://pub-xxxx.r2.dev"
              className="font-mono text-xs"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestStorage}
              disabled={storageTesting || storageSaving || storageDisconnecting}
              className="cursor-pointer gap-1.5"
            >
              {storageTesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Test</span>
            </Button>

            {isStorageConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectStorage}
                disabled={storageTesting || storageSaving || storageDisconnecting}
                className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {storageDisconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                <span>Disconnect</span>
              </Button>
            )}
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleSaveStorage}
            disabled={storageTesting || storageSaving || storageDisconnecting}
            className="cursor-pointer gap-1.5 bg-primary text-primary-foreground"
          >
            {storageSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

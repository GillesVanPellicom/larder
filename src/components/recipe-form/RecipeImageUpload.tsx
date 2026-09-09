import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { imagesApi } from '@/services/api'
import { isValidImageFile, compressImageToWebP } from '@/lib/imageCompression'
import {
  CloudUpload,
  Image as ImageIcon,
  Loader2,
  Trash2,
  RefreshCw,
  ExternalLink,
  MoreHorizontal,
  AlertCircle,
  X,
} from 'lucide-react'

interface RecipeImageUploadProps {
  imageUrl: string
  onImageUrlChange: (url: string) => void
  isMandatory?: boolean
  error?: string
  onClearError?: () => void
}

export function RecipeImageUpload({
  imageUrl,
  onImageUrlChange,
  isMandatory = false,
  error,
  onClearError,
}: RecipeImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [isReplacing, setIsReplacing] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')
  const [previousImageUrl, setPreviousImageUrl] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleProcessFile = async (file: File) => {
    setUploadError(null)
    onClearError?.()

    // 1. Validate file format
    const validation = isValidImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file format')
      return
    }

    try {
      setUploading(true)
      setUploadProgress('Processing image...')

      // 2. Client-side WebP compression
      const compressed = await compressImageToWebP(file)

      // 3. Upload to storage via backend
      const res = await imagesApi.upload(compressed.blob, file.name)
      onImageUrlChange(res.url)
      setIsReplacing(false)
      setMode('upload')
      setPreviousImageUrl('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setUploadError(msg)
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void handleProcessFile(file)
    }
  }

  const handleRemove = () => {
    onImageUrlChange('')
    setIsReplacing(false)
    setMode('upload')
    setUrlInputValue('')
    setPreviousImageUrl('')
    setUploadError(null)
    onClearError?.()
  }

  const handleStartReplace = () => {
    setPreviousImageUrl(imageUrl)
    setIsReplacing(true)
    setUrlInputValue('')
    setUploadError(null)
  }

  const handleCancelReplace = () => {
    if (previousImageUrl) {
      onImageUrlChange(previousImageUrl)
    }
    setIsReplacing(false)
    setMode('upload')
    setUrlInputValue('')
    setUploadError(null)
    setPreviousImageUrl('')
  }

  const toggleInputMode = () => {
    if (mode === 'upload') {
      if (imageUrl && !previousImageUrl) {
        setPreviousImageUrl(imageUrl)
      }
      setMode('url')
      setUrlInputValue('')
    } else {
      setMode('upload')
    }
    setUploadError(null)
  }

  // Only show "Enter URL instead" / "Upload image instead" when in dropzone mode or URL mode
  const showModeToggle = !imageUrl || isReplacing || mode === 'url'

  return (
    <div
      data-field="image_url"
      className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Cover Photo {isMandatory && <span className="text-destructive">*</span>}
          </h2>
          <InfoTooltip content="Upload a recipe cover photo (JPEG, PNG, WebP, AVIF, HEIC) or provide a direct image link." />
        </div>

        {showModeToggle && (
          <button
            type="button"
            onClick={toggleInputMode}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            {mode === 'url' ? 'Upload image instead' : 'Enter URL instead'}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Validation or Upload Error Banner */}
      {(uploadError || error) && (
        <div className="p-3 rounded-xl text-xs font-medium flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError || error}</span>
        </div>
      )}

      {/* Mode A: Direct URL Input */}
      {mode === 'url' ? (
        <div className="space-y-3">
          <div className="relative">
            <Input
              placeholder="https://images.unsplash.com/..."
              value={urlInputValue}
              onChange={(e) => {
                const val = e.target.value
                setUrlInputValue(val)
                onImageUrlChange(val)
                onClearError?.()
              }}
              className="pl-9 pr-4 font-mono text-xs"
            />
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>

          {urlInputValue && (
            <div className="relative w-full h-56 sm:h-64 md:h-72 rounded-xl overflow-hidden border border-border bg-muted/20">
              <img
                src={urlInputValue}
                alt="Recipe cover preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = ''
                }}
              />
              <div className="absolute top-3 right-3 z-10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemove}
                  className="h-9 w-9 rounded-lg bg-card/90 backdrop-blur-md border border-border shadow-sm hover:bg-card text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {(isReplacing || Boolean(previousImageUrl)) && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancelReplace}
                className="cursor-pointer font-semibold px-6 shadow-2xs"
              >
                <X className="h-4.5 w-4.5 mr-1.5" /> Cancel
              </Button>
            </div>
          )}
        </div>
      ) : imageUrl && !isReplacing ? (
        /* Mode B: Attached Cover Photo Card with Floating Context Menu */
        <div className="relative w-full h-56 sm:h-64 md:h-72 rounded-xl overflow-hidden border border-border bg-muted/20 group shadow-2xs">
          <img
            src={imageUrl}
            alt="Recipe cover"
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = ''
            }}
          />

          {/* Floating Context Menu (Identical to RecipeViewPage) */}
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-card/90 backdrop-blur-md border border-border shadow-sm hover:bg-card text-foreground cursor-pointer transition-colors"
                    title="Recipe image options"
                  >
                    <MoreHorizontal className="h-5 w-5 sm:h-4.5 sm:w-4.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-md">
                <DropdownMenuItem
                  onClick={() => window.open(imageUrl, '_blank', 'noreferrer')}
                  className="cursor-pointer gap-2 py-2 text-xs font-medium text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View original</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleStartReplace}
                  className="cursor-pointer gap-2 py-2 text-xs font-medium text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Replace</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleRemove}
                  className="cursor-pointer gap-2 py-2 text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        /* Mode C: Dropzone Area (New upload or Replace mode) */
        <div className="space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              isDragging
                ? 'border-primary bg-primary/10 shadow-xs'
                : 'border-border bg-muted/10 hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {uploadProgress || 'Processing image...'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-3 rounded-full bg-muted text-muted-foreground">
                  <CloudUpload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Drag and drop your recipe photo here, or <span className="text-primary underline">press to browse</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Supports JPEG, PNG, WebP, AVIF, and HEIC
                  </p>
                </div>
              </div>
            )}
          </div>

          {isReplacing && (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleCancelReplace}
                className="cursor-pointer font-semibold px-6 shadow-2xs"
              >
                <X className="h-4.5 w-4.5 mr-1.5" /> Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

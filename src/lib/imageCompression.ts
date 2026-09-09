/**
 * Allowed image MIME types and extensions.
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
]

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.heic', '.heif']

export function isValidImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' }
  }

  const isMimeValid = ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())
  const hasValidExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    file.name.toLowerCase().endsWith(ext)
  )

  if (!isMimeValid && !hasValidExt) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload an image (JPEG, PNG, WebP, AVIF, GIF, or HEIC).',
    }
  }

  // 25MB max raw file limit
  if (file.size > 25 * 1024 * 1024) {
    return {
      valid: false,
      error: 'File is too large. Maximum allowed size is 25MB.',
    }
  }

  return { valid: true }
}

/**
 * Compresses and converts any input image file to WebP format using client-side Canvas.
 * Automatically downscales ultra-large photos to a maximum dimension of 2560px for optimal speed and sharpness.
 */
export async function compressImageToWebP(
  file: File | Blob,
  maxDimension = 2560,
  quality = 0.85
): Promise<{ blob: Blob; width: number; height: number; originalSize: number; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img

      // Downscale if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to create canvas 2D rendering context'))
        return
      }

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to WebP blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to encode image to WebP format'))
            return
          }
          resolve({
            blob,
            width,
            height,
            originalSize,
            compressedSize: blob.size,
          })
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for processing'))
    }

    img.src = objectUrl
  })
}

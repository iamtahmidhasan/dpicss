import fs from 'fs/promises'
import { createReadStream } from 'fs'
import path from 'path'
import ImageKit from '@imagekit/nodejs'

const imageKitPrivateKey = process.env.IMAGE_KIT_PRIVATE_KEY
const imageKitUrlEndpoint = process.env.IMAGE_KIT_URL

const hasImageKitConfig = Boolean(imageKitPrivateKey && imageKitUrlEndpoint)

const imagekit = hasImageKitConfig
  ? new ImageKit({
      privateKey: imageKitPrivateKey as string,
    })
  : null

export function isImageKitConfigured(): boolean {
  return hasImageKitConfig && imagekit !== null
}

export function validateImageKitConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!imageKitPrivateKey) {
    errors.push('IMAGE_KIT_PRIVATE_KEY not set')
  }

  if (!imageKitUrlEndpoint) {
    errors.push('IMAGE_KIT_URL not set')
  }

  if (!imagekit && hasImageKitConfig) {
    errors.push('ImageKit client failed to initialize despite config present')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

type UploadResult = {
  url: string
  fileId: string | null
}

const UPLOAD_TIMEOUT_MS = 30000 // 30 seconds

export async function uploadLocalMediaFileToImageKit(args: {
  filename: string
  folder?: string
}): Promise<UploadResult | null> {
  if (!imagekit) {
    const config = validateImageKitConfig()
    if (!config.valid) {
      console.error('[ImageKit] Upload failed - missing configuration:', config.errors.join('; '))
    }
    return null
  }

  const localFilePath = path.resolve(process.cwd(), 'media', args.filename)

  try {
    await fs.access(localFilePath)
    const fileStream = createReadStream(localFilePath)

    // Wrap with timeout promise
    const uploadPromise = imagekit.files.upload({
      file: fileStream,
      fileName: args.filename,
      folder: args.folder || '/dpirc/media',
      useUniqueFileName: true,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('ImageKit upload timeout')), UPLOAD_TIMEOUT_MS),
    )

    const uploaded = await Promise.race([uploadPromise, timeoutPromise])

    const base = (imageKitUrlEndpoint || '').replace(/\/+$/, '')
    const filePath = String(uploaded.filePath || '').trim()
    const url = String(uploaded.url || '').trim() || (base && filePath ? `${base}${filePath}` : '')

    if (!url) {
      console.warn('[ImageKit] Upload succeeded but missing URL for file:', args.filename)
      return null
    }

    return {
      url,
      fileId: typeof uploaded.fileId === 'string' ? uploaded.fileId : null,
    }
  } catch (error) {
    console.error(
      '[ImageKit] Upload failed for local media file:',
      args.filename,
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export async function removeLocalMediaFiles(filenames: string[]): Promise<void> {
  const unique = Array.from(
    new Set(filenames.filter((name) => typeof name === 'string' && name.length > 0)),
  )
  await Promise.all(
    unique.map(async (filename) => {
      try {
        await fs.unlink(path.resolve(process.cwd(), 'media', filename))
      } catch {
        // No-op if missing or locked; cloud copy already exists.
      }
    }),
  )
}

type DeleteResult = {
  success: boolean
  error?: string
}

export async function deleteImageKitFile(fileId: string): Promise<DeleteResult> {
  if (!imagekit || !fileId) {
    return { success: false, error: 'ImageKit not configured or fileId missing' }
  }

  try {
    await imagekit.files.delete(fileId)
    return { success: true }
  } catch (error) {
    console.error('[ImageKit] Delete failed:', fileId, error instanceof Error ? error.message : error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function deleteImageKitFiles(fileIds: string[]): Promise<void> {
  const unique = Array.from(
    new Set(fileIds.filter((id) => typeof id === 'string' && id.length > 0)),
  )
  await Promise.all(unique.map((id) => deleteImageKitFile(id)))
}

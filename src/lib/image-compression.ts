import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: 'webp' | 'jpeg' | 'png'
  quality?: number
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: 'webp',
  quality: 0.85,
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {},
): Promise<File> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const compressedFile = await imageCompression(file, {
    maxSizeMB: mergedOptions.maxSizeMB,
    maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
    useWebWorker: mergedOptions.useWebWorker,
    fileType: mergedOptions.fileType as 'webp' | 'jpeg' | 'png' | undefined,
    initialQuality: mergedOptions.quality,
    alwaysKeepResolution: false,
    preserveExif: false,
  })

  const ext = mergedOptions.fileType === 'webp' ? '.webp' : mergedOptions.fileType === 'jpeg' ? '.jpg' : '.png'
  const baseName = file.name.replace(/\.[^.]+$/, '')
  const compressedName = `${baseName}${ext}`

  return new File([compressedFile], compressedName, {
    type: compressedFile.type,
  })
}

export async function compressImageForProfile(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
    fileType: 'webp',
    quality: 0.8,
  })
}

export async function compressImageForDocument(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    fileType: 'webp',
    quality: 0.85,
  })
}

export async function compressImageForMedia(file: File): Promise<File> {
  return compressImage(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1200,
    fileType: 'webp',
    quality: 0.85,
  })
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function isImageFileByName(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff'].includes(ext || '')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
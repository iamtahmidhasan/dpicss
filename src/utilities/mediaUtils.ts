import type { Payload, PayloadRequest } from 'payload'

/**
 * Utility functions for media asset management and organization
 */

/**
 * Update media usage statistics when an asset is referenced or dereferenced
 * @param payload - Payload instance or request object
 * @param mediaId - ID of the media to update
 * @param operation - 'increment' or 'decrement'
 * @param req - Optional PayloadRequest for transaction safety
 */
export async function updateMediaUsage(
  payload: Payload,
  mediaId: string,
  operation: 'increment' | 'decrement' = 'increment',
  req?: PayloadRequest,
): Promise<void> {
  try {
    const media = await payload.findByID({
      collection: 'media',
      id: mediaId,
    })

    if (!media) return

    const currentCount = media.usageCount || 0
    const newCount = operation === 'increment' ? currentCount + 1 : Math.max(0, currentCount - 1)

    const updateOpts: any = {
      collection: 'media',
      id: mediaId,
      data: {
        usageCount: newCount,
        lastUsed: new Date().toISOString(),
      },
    }

    // Pass req if available for transaction safety
    if (req) {
      updateOpts.req = req
    }

    await payload.update(updateOpts)
  } catch (error) {
    console.error('Error updating media usage:', error)
    // Don't throw - we don't want media tracking to break the main operation
  }
}

/**
 * Get media assets by category and usage
 */
export async function getMediaByCategory(
  payload: Payload,
  categoryId?: string,
  usage?: string,
  limit: number = 50,
) {
  const where: any = {}

  if (categoryId) {
    where.category = { equals: categoryId }
  }

  if (usage) {
    where.usage = { equals: usage }
  }

  return await payload.find({
    collection: 'media',
    where,
    limit,
    sort: '-createdAt',
  })
}

/**
 * Clean up unused media assets (with usage count of 0)
 */
export async function cleanupUnusedMedia(
  payload: Payload,
  dryRun: boolean = true,
): Promise<{
  found: number
  deleted: number
  errors: string[]
}> {
  const result = {
    found: 0,
    deleted: 0,
    errors: [] as string[],
  }

  try {
    // Find media with usage count of 0 and older than 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const unusedMedia = await payload.find({
      collection: 'media',
      where: {
        and: [{ usageCount: { equals: 0 } }, { createdAt: { less_than: thirtyDaysAgo } }],
      },
    })

    result.found = unusedMedia.totalDocs

    if (!dryRun) {
      for (const media of unusedMedia.docs) {
        try {
          await payload.delete({
            collection: 'media',
            id: media.id,
          })
          result.deleted++
        } catch (error) {
          result.errors.push(`Failed to delete media ${media.id}: ${error}`)
        }
      }
    }
  } catch (error) {
    result.errors.push(`Error during cleanup: ${error}`)
  }

  return result
}

/**
 * Generate smart folder suggestions based on usage patterns
 */
export function generateFolderSuggestion(media: any): string {
  const { usage, category, tags, filename } = media
  const parts: string[] = []

  // Base folder by usage
  switch (usage) {
    case 'course':
      parts.push('courses')
      break
    case 'post':
      parts.push('posts')
      break
    case 'profile':
      parts.push('profiles')
      break
    case 'thumbnail':
      parts.push('thumbnails')
      break
    case 'banner':
      parts.push('banners')
      break
    case 'icon':
      parts.push('icons')
      break
    default:
      parts.push('general')
  }

  // Add category if available
  if (category?.slug) {
    parts.push(category.slug)
  }

  // Add subfolder based on file type
  if (filename) {
    const extension = filename.split('.').pop()?.toLowerCase()
    if (extension) {
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        parts.push('images')
      } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
        parts.push('videos')
      } else if (['mp3', 'wav', 'aac'].includes(extension)) {
        parts.push('audio')
      } else {
        parts.push('documents')
      }
    }
  }

  return parts.join('/')
}

/**
 * Validate media asset before upload
 */
export function validateMediaAsset(file: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const maxFileSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'audio/mp3',
    'audio/wav',
    'audio/aac',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  if (file.size > maxFileSize) {
    errors.push('File size exceeds 50MB limit')
  }

  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

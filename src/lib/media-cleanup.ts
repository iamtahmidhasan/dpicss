import { getPayloadWithRetry } from '@/lib/payload-safe'
import { deleteImageKitFiles } from '@/lib/imagekit'
import { resolveMemberAvatarPublicUrl } from '@/lib/member-avatar-url'

export interface MediaCleanupResult {
  success: boolean
  deletedIds: string[]
  errors: string[]
}

export async function cleanupOldMedia(
  oldMediaId: string | null | undefined,
  newMediaId: string,
): Promise<MediaCleanupResult> {
  if (!oldMediaId || oldMediaId === newMediaId) {
    return { success: true, deletedIds: [], errors: [] }
  }

  const result: MediaCleanupResult = {
    success: true,
    deletedIds: [],
    errors: [],
  }

  try {
    const payload = await getPayloadWithRetry()

    const oldDoc = await payload.findByID({
      collection: 'media',
      id: oldMediaId,
      depth: 0,
      overrideAccess: true,
    }) as any

    if (!oldDoc) {
      return { success: true, deletedIds: [], errors: [] }
    }

    const imagekit = oldDoc.imagekit as { fileId?: string } | null
    const imageKitFileId = imagekit?.fileId

    if (imageKitFileId) {
      await deleteImageKitFiles([imageKitFileId])
      result.deletedIds.push(oldMediaId)
    }

    await payload.delete({
      collection: 'media',
      id: oldMediaId,
      overrideAccess: true,
    })
  } catch (error) {
    console.error('[MediaCleanup] Failed to cleanup old media:', oldMediaId, error)
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
  }

  return result
}

export async function getMediaImageKitFileId(mediaId: string): Promise<string | null> {
  try {
    const payload = await getPayloadWithRetry()
    const doc = await payload.findByID({
      collection: 'media',
      id: mediaId,
      depth: 0,
      overrideAccess: true,
    }) as any

    if (!doc) return null

    const imagekit = doc.imagekit as { fileId?: string } | null
    return imagekit?.fileId || null
  } catch {
    return null
  }
}

export async function isMediaUsedElsewhere(mediaId: string, excludeCollection?: string): Promise<boolean> {
  try {
    const payload = await getPayloadWithRetry()

    const collectionsToCheck = [
      'posts',
      'achievements',
      'shop',
      'categories',
      'courses',
      'events',
      'projects',
      'sponsors',
      'members',
    ]

    for (const collection of collectionsToCheck) {
      if (excludeCollection && collection === excludeCollection) continue

      const result = await payload.find({
        collection: collection as any,
        where: {
          or: [
            { featuredImage: { equals: mediaId } },
            { thumbnail: { equals: mediaId } },
            { avatar: { equals: mediaId } },
            { coverImage: { equals: mediaId } },
            { 'gallery.image': { equals: mediaId } },
            { logo: { equals: mediaId } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        select: { id: true },
      })

      if (result.totalDocs > 0) {
        return true
      }
    }

    return false
  } catch {
    return false
  }
}

export async function safeDeleteMedia(
  mediaId: string,
  options: { force?: boolean } = {},
): Promise<{ success: boolean; deleted: boolean; error?: string }> {
  try {
    const payload = await getPayloadWithRetry()

    if (!options.force) {
      const isUsed = await isMediaUsedElsewhere(mediaId)
      if (isUsed) {
        return { success: false, deleted: false, error: 'Media is still in use' }
      }
    }

    const fileId = await getMediaImageKitFileId(mediaId)
    if (fileId) {
      await deleteImageKitFiles([fileId])
    }

    await payload.delete({
      collection: 'media',
      id: mediaId,
      overrideAccess: true,
    })

    return { success: true, deleted: true }
  } catch (error) {
    console.error('[MediaCleanup] Safe delete failed:', mediaId, error)
    return {
      success: false,
      deleted: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
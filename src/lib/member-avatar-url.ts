import type { Payload } from 'payload'
import type { Media } from '@/payload-types'

const MEDIA_SLUG = 'media' as const

export function uiAvatarFallback(displayNameForFallback: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayNameForFallback)}&background=6366f1&color=fff&size=96`
}

/** Path served by Payload for a stored upload filename. */
function mediaFileServingPath(filename: string): string {
  return `/api/${MEDIA_SLUG}/file/${encodeURIComponent(filename)}`
}

/**
 * Public URL for a Media document (any subset of fields).
 * Uses Payload URLs when present; otherwise derives `/api/media/file/...` from stored filenames.
 */
export function pickMediaPublicUrl(media: Media | null | undefined): string | null {
  if (!media) return null

  const pluginGroup =
    'imagekit' in media && (media as { imagekit?: unknown }).imagekit
      ? ((media as { imagekit?: { url?: unknown; thumbnailUrl?: unknown } }).imagekit ?? null)
      : null
  const pluginUrl =
    pluginGroup && typeof pluginGroup.url === 'string' ? String(pluginGroup.url || '') : ''
  if (pluginUrl) return pluginUrl
  const pluginThumb =
    pluginGroup && typeof pluginGroup.thumbnailUrl === 'string'
      ? String(pluginGroup.thumbnailUrl || '')
      : ''
  if (pluginThumb) return pluginThumb

  const cloudUrl =
    'imageKitUrl' in media && typeof (media as { imageKitUrl?: unknown }).imageKitUrl === 'string'
      ? String((media as { imageKitUrl?: string }).imageKitUrl || '')
      : ''
  if (cloudUrl) return cloudUrl

  if (typeof media.url === 'string' && media.url.length > 0) return media.url

  const thumbUrl = media.sizes?.thumbnail?.url
  const cardUrl = media.sizes?.card?.url
  const heroUrl = media.sizes?.hero?.url
  const fromSizes =
    (typeof thumbUrl === 'string' && thumbUrl.length > 0 ? thumbUrl : null) ||
    (typeof cardUrl === 'string' && cardUrl.length > 0 ? cardUrl : null) ||
    (typeof heroUrl === 'string' && heroUrl.length > 0 ? heroUrl : null)
  if (fromSizes) return fromSizes

  if (typeof media.thumbnailURL === 'string' && media.thumbnailURL.length > 0) {
    return media.thumbnailURL
  }

  if (typeof media.filename === 'string' && media.filename.length > 0) {
    return mediaFileServingPath(media.filename)
  }

  for (const key of ['thumbnail', 'card', 'hero'] as const) {
    const fn = media.sizes?.[key]?.filename
    if (typeof fn === 'string' && fn.length > 0) return mediaFileServingPath(fn)
  }

  return null
}

export function resolveAvatarRefId(avatar: string | Media | null | undefined): string | null {
  if (typeof avatar === 'string' && avatar.length > 0) return avatar
  if (avatar && typeof avatar === 'object' && 'id' in avatar && (avatar as Media).id != null) {
    return String((avatar as Media).id)
  }
  return null
}

export type MemberAvatarRow = {
  id: string
  username?: string | null
  memberId?: string | null
  memberType?: string | null
  committeeRoles?: Array<{ committee?: { name?: string }; role?: string }>
  firstName: string
  lastName: string
  bio?: string | null
  level?: number | null
  totalPoints?: number | null
  avatar?: string | Media | null | undefined
}

/**
 * One batched media query for the whole directory, then stable URLs per member (no per-row DB round-trips).
 */
export async function resolveMemberAvatarUrlMap(
  payload: Payload,
  members: MemberAvatarRow[],
  googlePicturesByMemberId?: Map<string, string>,
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const ids = new Set<string>()
  for (const m of members) {
    const id = resolveAvatarRefId(m.avatar)
    if (id) ids.add(id)
  }

  let byId = new Map<string, Media>()
  if (ids.size > 0) {
    const res = await payload.find({
      collection: 'media',
      where: { id: { in: Array.from(ids) } },
      limit: Math.max(ids.size, 1),
      depth: 0,
      overrideAccess: true,
    })
    byId = new Map(res.docs.map((d) => [String(d.id), d as Media]))
  }

  for (const m of members) {
    const fallbackName = `${m.firstName} ${m.lastName}`
    const googlePic = googlePicturesByMemberId?.get(String(m.id))
    const fallback = googlePic || uiAvatarFallback(fallbackName)
    const populated =
      m.avatar && typeof m.avatar === 'object' && 'id' in m.avatar
        ? pickMediaPublicUrl(m.avatar as Media)
        : null
    const id = resolveAvatarRefId(m.avatar)
    const fromBatch = id ? pickMediaPublicUrl(byId.get(id)) : null
    out.set(String(m.id), populated || fromBatch || fallback)
  }

  return out
}

/**
 * Resolves a single member avatar for a public profile (one optional media fetch when URLs are missing).
 */
export async function resolveMemberAvatarPublicUrl(
  payload: Payload,
  avatar: string | Media | null | undefined,
  displayNameForFallback: string,
): Promise<string> {
  const populated =
    avatar && typeof avatar === 'object' && 'id' in avatar
      ? pickMediaPublicUrl(avatar as Media)
      : null
  if (populated) return populated

  const id = resolveAvatarRefId(avatar)
  if (!id) return uiAvatarFallback(displayNameForFallback)

  try {
    const doc = await payload.findByID({
      collection: 'media',
      id,
      depth: 0,
      overrideAccess: true,
    })
    const url = pickMediaPublicUrl(doc as Media)
    if (url) return url
  } catch {
    // invalid id or missing doc
  }

  return uiAvatarFallback(displayNameForFallback)
}

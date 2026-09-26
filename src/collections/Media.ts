import type { Access, CollectionConfig, Where } from 'payload'
import { authenticated, adminOnly } from '../access'
import { trackActivity } from '../hooks/trackActivity'
import { getCache, setCache } from '../lib/cache'
import { APIError } from 'payload'

const PUBLIC_MEDIA_CACHE_TTL_SECONDS = 300

/** Same visibility rules as the public member directory (listed official profiles). */
const publicDirectoryMemberWhere = (avatarMediaId: string): Where => ({
  and: [
    { isActive: { equals: true } },
    {
      or: [
        { directoryApprovalStatus: { equals: 'approved' } },
        { directoryApprovalStatus: { exists: false } },
      ],
    },
    { avatar: { equals: avatarMediaId } },
  ],
})

/** Matches Payload's static-file lookup (root + generated size filenames). */
const mediaFilenameWhere = (filename: string): Where => ({
  or: [
    { filename: { equals: filename } },
    { 'sizes.thumbnail.filename': { equals: filename } },
    { 'sizes.card.filename': { equals: filename } },
    { 'sizes.hero.filename': { equals: filename } },
  ],
})

type MinimalMediaDoc = {
  id: string
  usage?: string | null
  uploadedBy?: unknown
}

type LocalApiLike = {
  find: (args: {
    collection: string
    where?: Where
    limit?: number
    depth?: number
    overrideAccess?: boolean
    select?: Record<string, boolean>
  }) => Promise<{ docs: Record<string, unknown>[] }>
  findByID: (args: {
    collection: string
    id: string
    depth?: number
    overrideAccess?: boolean
    select?: Record<string, boolean>
  }) => Promise<Record<string, unknown> | null>
  findGlobal: (args: {
    slug: string
    depth?: number
    overrideAccess?: boolean
    select?: Record<string, boolean>
  }) => Promise<Record<string, unknown> | null>
}

const relationId = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (
    value &&
    typeof value === 'object' &&
    'id' in value &&
    (value as { id?: unknown }).id != null
  ) {
    return String((value as { id?: unknown }).id)
  }
  return ''
}

const hasPrivilegedMediaAccess = (roles: unknown): boolean => {
  if (!Array.isArray(roles)) return false
  return roles.includes('admin') || roles.includes('editor') || roles.includes('instructor')
}

const toMinimalMediaDoc = (value: unknown): MinimalMediaDoc | null => {
  if (!value || typeof value !== 'object') return null
  const doc = value as { id?: unknown; usage?: unknown; uploadedBy?: unknown }
  if (doc.id == null) return null
  return {
    id: String(doc.id),
    usage: typeof doc.usage === 'string' ? doc.usage : null,
    uploadedBy: doc.uploadedBy,
  }
}

async function isPublicContentMedia(payload: LocalApiLike, mediaId: string): Promise<boolean> {
  const cacheKey = `media:public:${mediaId}`
  const cached = await getCache<boolean>(cacheKey)
  if (typeof cached === 'boolean') {
    return cached
  }

  const [posts, achievements, products, categories, courses, header, footer] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: {
        and: [
          { status: { equals: 'published' } },
          {
            or: [
              { featuredImage: { equals: mediaId } },
              { 'seo.openGraph.ogImage': { equals: mediaId } },
              { 'seo.twitterCard.twitterImage': { equals: mediaId } },
            ],
          },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { id: true },
    }),
    payload.find({
      collection: 'achievements',
      where: {
        and: [
          { status: { equals: 'published' } },
          { or: [{ coverImage: { equals: mediaId } }, { 'gallery.image': { equals: mediaId } }] },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { id: true },
    }),
    payload.find({
      collection: 'shop',
      where: {
        and: [
          { status: { equals: 'published' } },
          {
            or: [{ featuredImage: { equals: mediaId } }, { 'gallery.image': { equals: mediaId } }],
          },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { id: true },
    }),
    payload.find({
      collection: 'categories',
      where: {
        and: [{ status: { equals: 'active' } }, { thumbnail: { equals: mediaId } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { id: true },
    }),
    payload.find({
      collection: 'courses',
      where: {
        and: [{ status: { equals: 'published' } }, { thumbnail: { equals: mediaId } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { id: true },
    }),
    payload.findGlobal({
      slug: 'header-settings',
      depth: 0,
      overrideAccess: true,
      select: { logo: true },
    }),
    payload.findGlobal({
      slug: 'footer-settings',
      depth: 0,
      overrideAccess: true,
      select: { footerLogo: true },
    }),
  ])

  const isPublic =
    posts.docs.length > 0 ||
    achievements.docs.length > 0 ||
    products.docs.length > 0 ||
    categories.docs.length > 0 ||
    courses.docs.length > 0 ||
    relationId(header?.logo) === mediaId ||
    relationId(footer?.footerLogo) === mediaId

  await setCache(cacheKey, isPublic, PUBLIC_MEDIA_CACHE_TTL_SECONDS)
  return isPublic
}

async function isEnrolledCourseMedia(
  payload: LocalApiLike,
  userId: string,
  mediaId: string,
): Promise<boolean> {
  const enrollments = await payload.find({
    collection: 'enrollments',
    where: {
      and: [{ student: { equals: userId } }, { status: { in: ['active', 'completed'] } }],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
    select: { course: true },
  })

  const courseIds = enrollments.docs
    .map((doc) => relationId(doc.course))
    .filter((courseId): courseId is string => courseId.length > 0)

  if (courseIds.length === 0) return false

  const matchedCourse = await payload.find({
    collection: 'courses',
    where: {
      and: [
        { id: { in: courseIds } },
        {
          or: [
            { thumbnail: { equals: mediaId } },
            { 'modules.lessons.videoFile': { equals: mediaId } },
            { 'modules.lessons.documentFile': { equals: mediaId } },
          ],
        },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    select: { id: true },
  })

  return matchedCourse.docs.length > 0
}

const readMediaAccess: Access = async ({ req, id, data, isReadingStaticFile }) => {
  const { user, payload } = req
  const api: LocalApiLike = {
    find: async ({ collection, where, limit, depth, overrideAccess, select }) =>
      payload.find({
        collection: collection as never,
        where,
        limit,
        depth,
        overrideAccess,
        select: select as never,
      }),
    findByID: async ({ collection, id: mediaId, depth, overrideAccess, select }) =>
      payload.findByID({
        collection: collection as never,
        id: mediaId,
        depth,
        overrideAccess,
        select: select as never,
      }),
    findGlobal: async ({ slug, depth, overrideAccess, select }) =>
      payload.findGlobal({
        slug: slug as never,
        depth,
        overrideAccess,
        select: select as never,
      }),
  }

  if (hasPrivilegedMediaAccess(user?.roles)) return true

  const profileUsageFilter: Where = { usage: { equals: 'profile' } }

  let mediaDoc = toMinimalMediaDoc(data)

  if (
    !mediaDoc &&
    isReadingStaticFile &&
    data &&
    typeof data === 'object' &&
    typeof (data as { filename?: unknown }).filename === 'string'
  ) {
    const filename = (data as { filename: string }).filename
    const match = await api.find({
      collection: 'media',
      where: mediaFilenameWhere(filename),
      limit: 1,
      depth: 0,
      overrideAccess: true,
      select: { id: true, usage: true, uploadedBy: true },
    })
    mediaDoc = toMinimalMediaDoc(match.docs[0])
  }

  if (!mediaDoc && typeof id === 'string' && id.length > 0) {
    const found = await api.findByID({
      collection: 'media',
      id,
      depth: 0,
      overrideAccess: true,
      select: { id: true, usage: true, uploadedBy: true },
    })
    mediaDoc = toMinimalMediaDoc(found)
  }

  if (!mediaDoc) {
    if (!user?.id) return false
    return {
      or: [{ uploadedBy: { equals: user.id } }, profileUsageFilter],
    }
  }

  const mediaId = mediaDoc.id
  const uploadedBy = relationId(mediaDoc.uploadedBy)
  if (user?.id && uploadedBy === user.id) return true

  const listed = await api.find({
    collection: 'members',
    where: publicDirectoryMemberWhere(mediaId),
    limit: 1,
    depth: 0,
    overrideAccess: true,
    select: { id: true },
  })
  if (listed.docs.length > 0) return true

  if (mediaDoc.usage === 'profile') return false

  if (await isPublicContentMedia(api, mediaId)) return true

  if (!user?.id) return false

  return isEnrolledCourseMedia(api, user.id, mediaId)
}

export const Media: CollectionConfig = {
  slug: 'media',
  folders: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'mimeType', 'usage', 'createdAt'],
    group: 'Content Management',
  },
  // ✅ DATABASE INDEXES for performance
  indexes: [
    { fields: ['usage'] }, // Filter by usage type
    { fields: ['imagekit.url'] }, // CDN lookups (plugin-managed)
    { fields: ['mimeType'] }, // Filter by file type
    // Note: 'filename' and 'createdAt' auto-indexed by Payload
  ],
  access: {
    read: readMediaAccess,
    create: authenticated,
    update: authenticated,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        if (data?.usage !== 'profile') return data
        if (!req.user) return data

        const isAdmin = Array.isArray(req.user.roles) && req.user.roles.includes('admin')
        if (isAdmin) return data

        const regSettings = await (req.payload as any).findGlobal({
          slug: 'registration-settings',
          depth: 0,
        }) as { oneTimeProfilePicture?: boolean } | null

        if (regSettings?.oneTimeProfilePicture !== true) return data

        const user = await (req.payload as any).findByID({
          collection: 'users',
          id: req.user.id,
          depth: 0,
          select: { memberCategory: true, officialMemberProfile: true, unofficialMemberProfile: true },
        })

        if (!user) return data

        const collection = user.memberCategory === 'official' ? 'members' : 'unofficial-members'
        const profileId = user.memberCategory === 'official'
          ? user.officialMemberProfile
          : user.unofficialMemberProfile

        if (!profileId) return data

        const profile = await (req.payload as any).findByID({
          collection,
          id: profileId,
          depth: 0,
          select: { avatar: true },
        })

        if (profile?.avatar) {
          throw new APIError(
            'Profile picture can only be set once. Please contact an administrator to change it.',
            403,
          )
        }

        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        if (!doc || typeof doc !== 'object') return doc
        const imagekitGroup =
          'imagekit' in doc && (doc as { imagekit?: unknown }).imagekit
            ? ((doc as { imagekit?: { url?: unknown } }).imagekit ?? null)
            : null
        const pluginUrl =
          imagekitGroup && typeof imagekitGroup.url === 'string'
            ? String(imagekitGroup.url || '')
            : ''
        const legacyUrl =
          'imageKitUrl' in doc && typeof (doc as { imageKitUrl?: unknown }).imageKitUrl === 'string'
            ? String((doc as { imageKitUrl?: string }).imageKitUrl || '')
            : ''
        const imageKitUrl = pluginUrl || legacyUrl
        if (imageKitUrl) {
          ;(doc as { url?: string }).url = imageKitUrl
          ;(doc as { imageKitUrl?: string }).imageKitUrl = imageKitUrl
        }
        return doc
      },
    ],
    afterChange: [
      trackActivity,
      async ({ doc, req, operation }) => {
        // Auto-populate metadata from uploaded file
        if (operation === 'create' && doc.filename) {
          const updatedDoc = { ...doc }

          // Extract file extension and type info
          const fileExtension = doc.filename.split('.').pop()?.toLowerCase()
          if (fileExtension) {
            // Respect client-provided usage (e.g. profile avatars). Only default when unset.
            if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
              if (!updatedDoc.usage) {
                updatedDoc.usage = 'general'
              }
            } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExtension)) {
              if (!updatedDoc.usage) {
                updatedDoc.usage = 'course'
              }
            }
          }

          // Update the document with auto-populated fields
          await req.payload.update({
            collection: 'media',
            id: doc.id,
            data: updatedDoc,
            req,
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'Display title for the media asset',
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Alt text for accessibility and SEO',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Detailed description of the media asset',
      },
    },
    {
      name: 'usage',
      type: 'select',
      options: [
        { label: 'Course Content', value: 'course' },
        { label: 'Post', value: 'post' },
        { label: 'Profile Picture', value: 'profile' },
        { label: 'Thumbnail', value: 'thumbnail' },
        { label: 'Banner', value: 'banner' },
        { label: 'Icon', value: 'icon' },
        { label: 'Certificate', value: 'certificate' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'general',
      required: true,
      admin: {
        description: 'Primary usage context',
      },
    },
    {
      name: 'imageKitUrl',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Cloud delivery URL from ImageKit',
      },
    },
    {
      name: 'imageKitFileId',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'ImageKit file identifier',
      },
    },
    {
      name: 'imageKitSyncedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last successful sync to ImageKit',
      },
    },
    {
      name: 'imageKitError',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Last ImageKit sync error (if any)',
      },
    },
    // File metadata (auto-populated)
    {
      name: 'filename',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Original filename',
      },
    },
    {
      name: 'mimeType',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'File MIME type',
      },
    },
    {
      name: 'fileSize',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'File size in bytes',
      },
    },
    {
      name: 'width',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Image width in pixels',
      },
    },
    {
      name: 'height',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Image height in pixels',
      },
    },
    {
      name: 'duration',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Video/audio duration in seconds',
      },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Reference count for this asset',
      },
    },
    {
      name: 'lastUsed',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last time this asset was linked from content',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        description: 'User who uploaded this asset',
      },
      hooks: {
        beforeChange: [
          ({ req, operation }) => {
            if (operation === 'create') {
              return req.user?.id
            }
          },
        ],
      },
    },
  ],
  upload: {
    // Enhanced upload configuration
    staticDir: 'media',
    adminThumbnail: 'thumbnail',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 640,
        height: 480,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1200,
        height: 600,
        position: 'centre',
      },
    ],
    mimeTypes: [
      'image/*',
      'video/*',
      'audio/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
  },
}

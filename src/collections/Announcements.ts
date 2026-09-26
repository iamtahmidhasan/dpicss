import type { Access, CollectionConfig } from 'payload'
import { adminOnly, editorAndAbove } from '../access'
import { pickLocalizedString } from '../lib/localized-string'
import { sendAnnouncementEmail } from '../lib/mail'

const announcementReadAccess: Access = async ({ req }) => {
  const { user, payload } = req

  if (!user) return false

  const isPrivileged =
    user.roles?.includes('admin') ||
    user.roles?.includes('editor') ||
    user.roles?.includes('instructor')

  if (isPrivileged) return true

  const memberCategory = user.memberCategory

  const or: Record<string, unknown>[] = [{ 'audience.targetType': { equals: 'all' } }]

  if (memberCategory === 'official') {
    or.push({ 'audience.targetType': { equals: 'official' } })
  }

  if (memberCategory === 'unofficial') {
    or.push({ 'audience.targetType': { equals: 'unofficial' } })
  }

  or.push({
    and: [
      { 'audience.targetType': { equals: 'users' } },
      { 'audience.targetUsers': { in: [user.id] } },
    ],
  })

  try {
    const enrollmentResult = await payload.find({
      collection: 'enrollments',
      where: {
        and: [{ student: { equals: user.id } }, { status: { in: ['active', 'completed'] } }],
      },
      depth: 0,
      limit: 200,
      overrideAccess: true,
      req,
    })

    const courseIds = enrollmentResult.docs
      .map((doc) => {
        const course = doc?.course as unknown
        if (course && typeof course === 'object' && 'id' in course) {
          return String((course as { id?: string }).id || '')
        }
        return String(course || '')
      })
      .filter(Boolean)

    if (courseIds.length > 0) {
      or.push({
        and: [
          { 'audience.targetType': { equals: 'course' } },
          { 'audience.targetCourse': { in: courseIds } },
        ],
      })
    }
  } catch {
    // Ignore enrollment lookup errors for access control.
  }

  return {
    and: [{ status: { equals: 'published' } }, { or }],
  } as any
}

type AnnouncementDoc = {
  id: string
  title?: string | Record<string, unknown>
  summary?: string | Record<string, unknown>
  content?: unknown
  status?: 'draft' | 'published' | 'archived'
  sendEmail?: boolean
  emailSubject?: string
  audience?: {
    targetType?: 'all' | 'official' | 'unofficial' | 'course' | 'users'
    targetCourse?: string | { id?: string }
    targetUsers?: Array<string | { id?: string }>
  }
}

function asId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in value) {
    return String((value as { id?: string }).id || '')
  }
  return ''
}

async function resolveAudienceEmails(doc: AnnouncementDoc, req: { payload: any }) {
  const targetType = doc.audience?.targetType || 'all'
  const payload = req.payload

  const emails = new Set<string>()

  const addEmail = (email: unknown) => {
    if (typeof email === 'string' && email.trim()) {
      emails.add(email.trim().toLowerCase())
    }
  }

  const fetchUsers = async (where: Record<string, unknown>) => {
    let page = 1
    let hasNext = true

    while (hasNext) {
      const result = await payload.find({
        collection: 'users',
        where,
        depth: 0,
        limit: 200,
        page,
        overrideAccess: true,
        req,
      })

      result.docs.forEach((user: Record<string, unknown>) => {
        addEmail(user.email)
      })

      hasNext = result.hasNextPage
      page = result.nextPage || page + 1
    }
  }

  if (targetType === 'users') {
    const ids = (doc.audience?.targetUsers || []).map((value) => asId(value)).filter(Boolean)

    if (ids.length > 0) {
      await fetchUsers({ id: { in: ids } })
    }

    return Array.from(emails)
  }

  if (targetType === 'course') {
    const courseId = asId(doc.audience?.targetCourse)

    if (!courseId) return []

    const enrollments = await payload.find({
      collection: 'enrollments',
      where: {
        and: [{ course: { equals: courseId } }, { status: { in: ['active', 'completed'] } }],
      },
      depth: 0,
      limit: 500,
      overrideAccess: true,
      req,
    })

    const userIds = enrollments.docs
      .map((doc: Record<string, unknown>) => asId(doc.student))
      .filter(Boolean)

    if (userIds.length > 0) {
      await fetchUsers({ id: { in: userIds } })
    }

    return Array.from(emails)
  }

  const memberCategoryWhere =
    targetType === 'official'
      ? { memberCategory: { equals: 'official' } }
      : targetType === 'unofficial'
        ? { memberCategory: { equals: 'unofficial' } }
        : { memberCategory: { in: ['official', 'unofficial'] } }

  await fetchUsers({
    and: [memberCategoryWhere, { isActive: { equals: true } }, { isVerified: { equals: true } }],
  })

  return Array.from(emails)
}

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
    group: 'Content Management',
  },
  access: {
    read: announcementReadAccess,
    create: editorAndAbove,
    update: editorAndAbove,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.status === 'published' && !data?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req, context }) => {
        if (context?.skipAnnouncementEmail) return doc

        const statusPublished = doc.status === 'published'
        const wasPublished = previousDoc?.status === 'published'

        if (!statusPublished || wasPublished) return doc
        if (doc.sendEmail === false) return doc

        const recipients = await resolveAudienceEmails(doc as AnnouncementDoc, req)

        if (recipients.length === 0) return doc

        const baseTitle = pickLocalizedString(doc.title, 'en') || 'Announcement'
        const summary = pickLocalizedString(doc.summary, 'en') || ''
        const subject = doc.emailSubject?.trim() || baseTitle

        const appUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'
        const announcementUrl = `${appUrl}/account?tab=announcements&announcement=${doc.id}`

        let sentCount = 0
        let failedCount = 0

        const batchSize = 50
        for (let i = 0; i < recipients.length; i += batchSize) {
          const batch = recipients.slice(i, i + batchSize)
          const results = await Promise.allSettled(
            batch.map((email) =>
              sendAnnouncementEmail({
                to: email,
                subject,
                title: baseTitle,
                summary,
                actionUrl: announcementUrl,
              }),
            ),
          )

          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.ok) {
              sentCount += 1
            } else {
              failedCount += 1
            }
          })
        }

        await (req.payload as any).update({
          collection: 'announcements',
          id: String(doc.id),
          data: {
            emailSentAt: new Date().toISOString(),
            emailSentCount: sentCount,
            emailFailedCount: failedCount,
          },
          overrideAccess: true,
          context: { skipAnnouncementEmail: true },
          req,
        })

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        condition: (data) => data.status === 'published',
        readOnly: true,
      },
    },
    {
      name: 'audience',
      type: 'group',
      fields: [
        {
          name: 'targetType',
          type: 'select',
          defaultValue: 'all',
          required: true,
          options: [
            { label: 'All members', value: 'all' },
            { label: 'Official members', value: 'official' },
            { label: 'Unofficial members', value: 'unofficial' },
            { label: 'Enrolled in a course', value: 'course' },
            { label: 'Specific users', value: 'users' },
          ],
        },
        {
          name: 'targetCourse',
          type: 'relationship',
          relationTo: 'courses',
          admin: {
            condition: (_, siblingData) => siblingData?.targetType === 'course',
          },
        },
        {
          name: 'targetUsers',
          type: 'relationship',
          relationTo: 'users',
          hasMany: true,
          admin: {
            condition: (_, siblingData) => siblingData?.targetType === 'users',
          },
        },
      ],
    },
    {
      name: 'sendEmail',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'emailSubject',
      type: 'text',
      admin: {
        condition: (data) => Boolean(data.sendEmail),
      },
    },
    {
      name: 'emailSentAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'emailSentCount',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'emailFailedCount',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}

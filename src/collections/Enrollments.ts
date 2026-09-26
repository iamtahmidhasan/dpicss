import type { CollectionConfig, PayloadRequest } from 'payload'
import { adminOnly, anyone, editorAndAbove } from '../access'
import { withPayloadTransaction } from '../lib/payload-transaction'
import {
  sendEnrollmentApprovedEmail,
  sendEnrollmentRequestSubmittedEmail,
  sendEnrollmentStatusUpdateEmail,
} from '../lib/mail'

async function syncCourseEnrollmentCount(req: PayloadRequest, courseId: string) {
  const countResult = await req.payload.count({
    collection: 'enrollments',
    where: {
      and: [{ course: { equals: courseId } }, { status: { in: ['active', 'completed'] } }],
    },
    overrideAccess: true,
  })

  await req.payload.update({
    collection: 'courses',
    id: courseId,
    data: {
      enrollmentCount: countResult.totalDocs || 0,
    },
    req,
    overrideAccess: true,
  })
}

async function getUserEmail(req: PayloadRequest, userId: string): Promise<string | null> {
  const user = await req.payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
    overrideAccess: true,
  })
  return user?.email || null
}

async function getCourseTitle(req: PayloadRequest, courseId: string): Promise<string> {
  const course = await req.payload.findByID({
    collection: 'courses',
    id: courseId,
    depth: 0,
    overrideAccess: true,
  })
  if (!course) return 'Course'
  const title = course.title as Record<string, string> | string
  if (typeof title === 'object') return title['en'] || title['bn'] || 'Course'
  return title || 'Course'
}

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['student', 'course', 'status', 'enrolledAt'],
    group: 'Learning Management',
    description: 'Manage student course enrollments and requests',
  },
  indexes: [
    { fields: ['student'] },
    { fields: ['course'] },
    { fields: ['status'] },
    { fields: ['student', 'course'] },
    { fields: ['student', 'status'] },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin') || user.roles?.includes('instructor')) return true
      return { student: { equals: user.id } }
    },
    create: ({ req: { user } }) => {
      // Users can create enrollment requests
      if (!user) return false
      return true
    },
    update: editorAndAbove,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'create' && req.user) {
          // Auto-fill student from logged in user
          data.student = req.user.id
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, previousDoc, operation }) => {
        try {
          await withPayloadTransaction(req, async () => {
            await syncCourseEnrollmentCount(req, String(doc.course))
            const previousCourseId = previousDoc?.course ? String(previousDoc.course) : ''
            if (previousCourseId && previousCourseId !== String(doc.course)) {
              await syncCourseEnrollmentCount(req, previousCourseId)
            }

            const userEmail = await getUserEmail(req, String(doc.student))
            const user = await req.payload.findByID({
              collection: 'users',
              id: String(doc.student),
              depth: 0,
              overrideAccess: true,
            })
            const studentName = user?.email?.split('@')[0] || 'there'
            const courseTitle = await getCourseTitle(req, String(doc.course))
            const appUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'https://dpirc.com'

            if (!userEmail) return

            const courseUrl = `${appUrl}/courses/${typeof courseTitle === 'string' ? courseTitle.toLowerCase().replace(/\s+/g, '-') : 'course'}`

            if (operation === 'create') {
              if (doc.status === 'pending') {
                await sendEnrollmentRequestSubmittedEmail({
                  to: userEmail,
                  courseTitle,
                  studentName,
                })
              } else if (doc.status === 'active') {
                await sendEnrollmentApprovedEmail({
                  to: userEmail,
                  courseTitle,
                  courseUrl: `${appUrl}/courses`,
                })
              }
            }

            if (previousDoc && previousDoc.status !== doc.status) {
              await sendEnrollmentStatusUpdateEmail({
                to: userEmail,
                courseTitle,
                studentName,
                newStatus: doc.status as 'active' | 'pending' | 'suspended' | 'completed' | 'revoked' | 'rejected',
                adminNotes: doc.adminNotes || undefined,
              })
            }
          })
        } catch (err) {
          req.payload.logger.error(`Failed to reconcile enrollmentCount or send email: ${err}`)
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        try {
          await withPayloadTransaction(req, async () => {
            await syncCourseEnrollmentCount(req, String(doc.course))
          })
        } catch (err) {
          req.payload.logger.error(`Failed to reconcile enrollmentCount on delete: ${err}`)
        }
      },
    ],
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { description: 'The enrolled student' },
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      admin: { description: 'The course this enrollment belongs to' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: '⏳ Pending Review', value: 'pending' },
        { label: '✅ Active', value: 'active' },
        { label: '⏸ Suspended', value: 'suspended' },
        { label: '✔️ Completed', value: 'completed' },
        { label: '🚫 Revoked', value: 'revoked' },
        { label: '❌ Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'memberType',
      type: 'select',
      required: true,
      defaultValue: 'unofficial',
      options: [
        { label: 'Official DPI Member', value: 'official' },
        { label: 'Unofficial Member', value: 'unofficial' },
      ],
      admin: { description: 'Member type at time of enrollment', position: 'sidebar' },
    },
    {
      name: 'payment',
      type: 'group',
      admin: { description: 'Payment details' },
      fields: [
        {
          name: 'amount',
          type: 'number',
          min: 0,
          admin: { description: 'Amount paid in BDT' },
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'BDT',
          options: [
            { label: 'BDT (৳)', value: 'BDT' },
            { label: 'USD ($)', value: 'USD' },
          ],
        },
        {
          name: 'method',
          type: 'select',
          options: [
            { label: 'bKash', value: 'bkash' },
            { label: 'Nagad', value: 'nagad' },
            { label: 'Rocket', value: 'rocket' },
            { label: 'Bank Transfer', value: 'bank' },
            { label: 'Cash', value: 'cash' },
            { label: 'Free / Scholarship', value: 'free' },
          ],
        },
        {
          name: 'transactionId',
          type: 'text',
          admin: { description: 'Transaction ID from payment' },
        },
        {
          name: 'paidAt',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'notes',
          type: 'textarea',
          admin: { description: 'Admin notes about this payment' },
        },
      ],
    },
    {
      name: 'enrolledAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      admin: {
        description: 'Set automatically when progress reaches 100%',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Optional: enrollment expiry date',
        date: { pickerAppearance: 'dayOnly' },
        position: 'sidebar',
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: { description: 'Admin notes about this enrollment' },
    },
  ],
  timestamps: true,
}
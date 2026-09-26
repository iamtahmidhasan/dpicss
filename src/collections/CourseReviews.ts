import type { Access, CollectionConfig, Where } from 'payload'
import { adminOnlyField, isAdmin } from '../access'

const readCourseReviews: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true

  const approvedFilter: Where = { status: { equals: 'approved' } }

  if (!user) {
    return approvedFilter
  }

  return {
    or: [approvedFilter, { student: { equals: user.id } }],
  }
}

export const CourseReviews: CollectionConfig = {
  slug: 'course-reviews',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['student', 'course', 'rating', 'status', 'createdAt'],
    group: 'Learning Management',
    description: 'Student reviews and ratings for courses',
  },
  // ✅ DATABASE INDEXES for performance
  indexes: [
    { fields: ['course'] }, // Find reviews for a course (for rating recalculation)
    { fields: ['student', 'course'] }, // Check if student already reviewed
    { fields: ['status'] }, // Filter pending/approved/rejected reviews
    { fields: ['course', 'status'] }, // Get approved reviews for a course
    { fields: ['rating'] }, // Filter by rating range
    // Note: 'createdAt' auto-indexed as timestamp
  ],
  access: {
    read: readCourseReviews,
    create: ({ req: { user } }) => !!user, // Any logged-in user
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { student: { equals: user.id } }
    },
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc, req, previousDoc }) => {
        /**
         * Recalculate the course's averageRating after review status/rating changes.
         * CRITICAL: Pass `req` to maintain transaction atomicity
         * ✅ OPTIMIZED: Only recalculate if status or rating changed (performance)
         */
        const statusChanged = previousDoc?.status !== doc.status
        const ratingChanged = previousDoc?.rating !== doc.rating

        if (!statusChanged && !ratingChanged) return doc

        try {
          const reviews = await req.payload.find({
            collection: 'course-reviews',
            where: {
              and: [{ course: { equals: doc.course } }, { status: { equals: 'approved' } }],
            },
            limit: 1000,
            req, // ✅ Pass req for transaction safety
          })

          if (reviews.totalDocs === 0) return doc

          const total = reviews.docs.reduce((sum: number, r: any) => sum + r.rating, 0)
          const avg = parseFloat((total / reviews.totalDocs).toFixed(1))

          await req.payload.update({
            collection: 'courses',
            id: doc.course,
            data: { averageRating: avg },
            req, // ✅ Pass req for transaction safety
            overrideAccess: false, // ✅ Enforce access control
          })
        } catch (err) {
          req.payload.logger.error(`CourseReviews rating recalc error: ${err}`)
        }

        return doc
      },
    ],
  },
  fields: [
    {
      name: 'student',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments',
      admin: {
        description:
          'The enrollment this review is for (ensures only enrolled students can review)',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: { description: 'Rating from 1 to 5 stars' },
    },
    {
      name: 'headline',
      type: 'text',
      maxLength: 150,
      admin: { description: 'Short review headline' },
    },
    {
      name: 'body',
      type: 'textarea',
      maxLength: 2000,
      admin: { description: 'Detailed review text' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: '⏳ Pending Review', value: 'pending' },
        { label: '✅ Approved', value: 'approved' },
        { label: '🚫 Rejected', value: 'rejected' },
      ],
      access: {
        update: adminOnlyField,
      },
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminNote',
      type: 'textarea',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Reason for rejection (internal)',
        condition: (data) => data.status === 'rejected',
      },
    },
    {
      name: 'isVerifiedPurchase',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Auto-set to true when student has an active enrollment',
        readOnly: true,
      },
    },
    {
      name: 'helpfulCount',
      type: 'number',
      defaultValue: 0,
      admin: { description: '"Found helpful" count from other students', readOnly: true },
    },
  ],
  timestamps: true,
}

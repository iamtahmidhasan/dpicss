import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrInstructor, instructorCourseAccess } from '../access'
import { pickLocalizedString } from '../lib/localized-string'
import { invalidateCollectionCache } from '../lib/cache/optimized-fetch'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'enrollmentCount', 'createdAt'],
    group: 'Learning Management',
  },
  // ✅ DATABASE INDEXES for performance
  indexes: [
    { fields: ['status'] },
    { fields: ['instructors'] },
    { fields: ['category'] },
    { fields: ['status', 'instructors'] },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return { status: { equals: 'published' } }
    },
    create: isAdminOrInstructor,
    update: instructorCourseAccess,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const modules = Array.isArray(data?.modules) ? data.modules : []

        const moduleOrderSet = new Set<number>()
        for (const moduleItem of modules as Array<{ order?: unknown; lessons?: unknown[] }>) {
          const moduleOrder = Number(moduleItem?.order)
          if (!Number.isInteger(moduleOrder) || moduleOrder < 1) {
            throw new Error('Each module order must be a positive integer')
          }
          if (moduleOrderSet.has(moduleOrder)) {
            throw new Error(`Duplicate module order detected: ${moduleOrder}`)
          }
          moduleOrderSet.add(moduleOrder)

          const lessons = Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []
          const lessonOrderSet = new Set<number>()
          for (const lesson of lessons as Array<{ order?: unknown }>) {
            const lessonOrder = Number(lesson?.order)
            if (!Number.isInteger(lessonOrder) || lessonOrder < 1) {
              throw new Error('Each lesson order must be a positive integer')
            }
            if (lessonOrderSet.has(lessonOrder)) {
              throw new Error(
                `Duplicate lesson order detected in module ${moduleOrder}: ${lessonOrder}`,
              )
            }
            lessonOrderSet.add(lessonOrder)
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'update' || operation === 'create') {
          await invalidateCollectionCache('courses')
        }
        return doc
      },
    ],
    afterDelete: [
      async () => {
        await invalidateCollectionCache('courses')
      },
    ],
  },
  fields: [
    // ── Basic Info ──────────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Full course title shown to students' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title)',
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            if (!value && data?.title) {
              const base = pickLocalizedString(data.title, 'en')
              if (!base) return value
              return base
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 300,
      admin: { description: 'Shown on course cards (max 300 chars)' },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
      admin: { description: 'Full course description shown on single course page' },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      required: process.env.NODE_ENV === 'production',
      admin: { description: 'Course cover image (recommended: 1280×720px)' },
    },
    {
      name: 'previewVideo',
      type: 'text',
      admin: {
        description: 'Optional YouTube/Vimeo embed URL for a free preview',
        placeholder: 'https://www.youtube.com/embed/...',
      },
    },

    // ── Categorisation ──────────────────────────────────────────────────────────
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Robotics Fundamentals', value: 'robotics-fundamentals' },
        { label: 'Programming & Coding', value: 'programming' },
        { label: 'Electronics & Circuit', value: 'electronics' },
        { label: 'Mechanical Design', value: 'mechanical' },
        { label: 'AI & Machine Learning', value: 'ai-ml' },
        { label: 'Competition Prep', value: 'competition' },
        { label: 'Project Management', value: 'project-management' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: { description: 'Searchable tags for better discoverability' },
    },
    {
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'beginner',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
      ],
    },
    {
      name: 'language',
      type: 'select',
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Bangla', value: 'bn' },
        { label: 'English + Bangla', value: 'en-bn' },
      ],
    },

    // ── Instructors ──────────────────────────────────────────────────────────────
    {
      name: 'instructors',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      required: true,
      admin: {
        description: 'Official members who are instructors for this course',
        position: 'sidebar',
      },
    },

    // ── Pricing & Access ────────────────────────────────────────────────────────
    {
      name: 'memberType',
      type: 'select',
      required: true,
      defaultValue: 'both',
      options: [
        { label: 'Official Members Only', value: 'official' },
        { label: 'Unofficial Members Only', value: 'unofficial' },
        { label: 'All Members (Official & Unofficial)', value: 'both' },
      ],
      admin: {
        description: 'Who can enroll in this course',
        position: 'sidebar',
      },
    },
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'officialMemberPrice',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'Price in BDT for official DPI members (0 = free)' },
        },
        {
          name: 'unofficialMemberPrice',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'Price in BDT for unofficial members (0 = free)' },
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
      ],
    },

    // ── WhatsApp Enroll Contact ─────────────────────────────────────────────────
    {
      name: 'enrollmentContact',
      type: 'group',
      admin: { description: 'WhatsApp contact for enrollment' },
      fields: [
        {
          name: 'whatsappNumber',
          type: 'text',
          required: true,
          admin: {
            description: 'WhatsApp number with country code (e.g., +8801XXXXXXXXX)',
            placeholder: '+8801XXXXXXXXX',
          },
        },
        {
          name: 'whatsappMessage',
          type: 'textarea',
          admin: {
            description: 'Pre-filled WhatsApp message template. Use {courseName} as placeholder.',
            placeholder:
              'Hi, I want to enroll in {courseName}. Please guide me through the payment process.',
          },
        },
      ],
    },

    // ── Payment Information ─────────────────────────────────────────────────────
    {
      name: 'paymentInfo',
      type: 'group',
      admin: { description: 'Custom payment numbers for this course (overrides global settings)' },
      fields: [
        {
          name: 'useCustomPayment',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Use custom payment numbers instead of global settings' },
        },
        {
          name: 'bkashNumber',
          type: 'text',
          admin: {
            description: 'bKash number for this course',
            condition: (data, siblingData) => siblingData?.useCustomPayment === true,
          },
        },
        {
          name: 'nagadNumber',
          type: 'text',
          admin: {
            description: 'Nagad number for this course',
            condition: (data, siblingData) => siblingData?.useCustomPayment === true,
          },
        },
        {
          name: 'rocketNumber',
          type: 'text',
          admin: {
            description: 'Rocket number for this course',
            condition: (data, siblingData) => siblingData?.useCustomPayment === true,
          },
        },
        {
          name: 'cashInstructions',
          type: 'textarea',
          admin: {
            description: 'Instructions for cash payment (office address, contact, etc.)',
            condition: (data, siblingData) => siblingData?.useCustomPayment === true,
          },
        },
      ],
    },

    // ── Course Meta ─────────────────────────────────────────────────────────────
    {
      name: 'duration',
      type: 'group',
      fields: [
        {
          name: 'totalHours',
          type: 'number',
          min: 0,
          admin: { description: 'Estimated total hours to complete' },
        },
        {
          name: 'totalWeeks',
          type: 'number',
          min: 0,
          admin: { description: 'Estimated weeks at recommended pace' },
        },
      ],
    },
    {
      name: 'requirements',
      type: 'array',
      fields: [{ name: 'requirement', type: 'text' }],
      admin: { description: 'Prerequisites or requirements to join the course' },
    },
    {
      name: 'learningOutcomes',
      type: 'array',
      fields: [{ name: 'outcome', type: 'text' }],
      admin: { description: 'What students will be able to do after completing the course' },
    },

    // ── Modules & Lessons ───────────────────────────────────────────────────────
    {
      name: 'modules',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Course curriculum organized into modules',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'order',
          type: 'number',
          required: true,
          min: 1,
          admin: { description: 'Display order of this module' },
        },
        {
          name: 'lessons',
          type: 'array',
          required: true,
          minRows: 1,
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [
                { label: '▶ Video Lesson', value: 'video' },
                { label: '📄 Document / Reading', value: 'document' },
                { label: '🔴 Live Session (Google Meet)', value: 'live' },
              ],
            },
            {
              name: 'order',
              type: 'number',
              required: true,
              min: 1,
            },
            {
              name: 'duration',
              type: 'text',
              admin: {
                description: 'e.g., "12:34" for video or "10 min read" for documents',
              },
            },
            {
              name: 'isFreePreview',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Allow non-enrolled users to access this lesson as a free preview',
              },
            },
            // Video fields
            {
              name: 'videoUrl',
              type: 'text',
              validate: (value: unknown) => {
                if (!value) return true
                if (typeof value !== 'string') return 'Video URL must be a string'
                const url = value.trim()
                if (!url) return true

                const isEmbed =
                  /^https:\/\/(www\.)?youtube\.com\/embed\//i.test(url) ||
                  /^https:\/\/player\.vimeo\.com\/video\//i.test(url)

                if (!isEmbed) {
                  return 'videoUrl must be a YouTube or Vimeo embed URL'
                }

                return true
              },
              admin: {
                description: 'YouTube/Vimeo embed URL or direct video URL',
                condition: (data, siblingData) => siblingData?.type === 'video',
              },
            },
            {
              name: 'videoFile',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Or upload video directly (use for private hosting)',
                condition: (data, siblingData) => siblingData?.type === 'video',
              },
            },
            // Document fields
            {
              name: 'documentFile',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Upload PDF, DOCX, or any document',
                condition: (data, siblingData) => siblingData?.type === 'document',
              },
            },
            {
              name: 'documentContent',
              type: 'richText',
              admin: {
                description: 'Or write content directly (shown as rich text)',
                condition: (data, siblingData) => siblingData?.type === 'document',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: { description: 'Short description of this lesson' },
            },
            // Live session fields
            {
              name: 'googleMeetLink',
              type: 'text',
              admin: {
                description: 'Google Meet link for live session',
                condition: (data, siblingData) => siblingData?.type === 'live',
              },
            },
            {
              name: 'scheduledAt',
              type: 'date',
              admin: {
                description: 'Date and time of live session',
                date: { pickerAppearance: 'dayAndTime' },
                condition: (data, siblingData) => siblingData?.type === 'live',
              },
            },
            
          ],
        },
      ],
    },

    // ── Stats (computed / manually updated) ────────────────────────────────────
    {
      name: 'enrollmentCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Total enrolled students (auto-updated)',
        position: 'sidebar',
        readOnly: false,
      },
    },
    {
      name: 'averageRating',
      type: 'number',
      min: 0,
      max: 5,
      defaultValue: 0,
      admin: {
        description: 'Average rating out of 5 (auto-calculated)',
        position: 'sidebar',
      },
    },
    {
      name: 'completionCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Students who completed 100% (auto-updated)',
        position: 'sidebar',
      },
    },

    // ── Publication ─────────────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: '📝 Draft', value: 'draft' },
        { label: '🔍 Under Review', value: 'review' },
        { label: '✅ Published', value: 'published' },
        { label: '🚫 Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Pin to featured section on the courses page',
        position: 'sidebar',
      },
    },
    {
      name: 'certificateTemplate',
      type: 'group',
      admin: { description: 'Certificate configuration for this course' },
      fields: [
        {
          name: 'issueCertificate',
          type: 'checkbox',
          defaultValue: true,
          admin: { description: 'Automatically issue certificate on 100% completion' },
        },
        {
          name: 'certificateTitle',
          type: 'text',
          defaultValue: 'Certificate of Completion',
          admin: { description: 'Title shown on the certificate' },
        },
        {
          name: 'certificateDescription',
          type: 'textarea',
          admin: {
            description:
              'Body text of the certificate (use {studentName}, {courseName}, {completionDate})',
          },
        },
        {
          name: 'signatoryName',
          type: 'text',
          admin: { description: 'Name of signing authority (e.g., Club President)' },
        },
        {
          name: 'signatoryTitle',
          type: 'text',
          admin: { description: 'Title of signing authority' },
        },
        {
          name: 'signatorySignature',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Signature image (PNG with transparent background)' },
        },
        {
          name: 'clubLogo',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Club logo for the certificate' },
        },
      ],
    },
  ],
  timestamps: true,
}

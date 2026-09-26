import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { adminOnly, authenticated } from '../access'

/**
 * Standalone module documents (legacy / optional). New courses use embedded `Courses.modules`.
 */
export const CourseModules: CollectionConfig = {
  slug: 'course-modules',
  admin: {
    group: 'Learning Management',
    useAsTitle: 'title',
    description: 'Legacy collection. New development should use embedded Courses.modules only.',
    hidden: true,
  },
  access: {
    read: authenticated,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ operation }) => {
        if (operation === 'create' && process.env.ALLOW_LEGACY_COURSE_MODULES !== 'true') {
          throw new APIError(
            'Legacy course-modules creation is disabled. Use embedded Courses.modules.',
            409,
          )
        }
      },
    ],
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
    },
    { name: 'title', type: 'text', required: true },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'text',
      options: [
        { label: 'Video', value: 'video' },
        { label: 'Text', value: 'text' },
        { label: 'Quiz', value: 'quiz' },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'text' || siblingData?.type === 'quiz',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.type === 'video',
      },
    },
  ],
  timestamps: true,
}

import type { CollectionConfig } from 'payload'
import { editorAndAbove, adminOnly } from '../access'
import { pickLocalizedString } from '../lib/localized-string'
import { trackActivity } from '../hooks/trackActivity'
import { trackMediaUsage } from '../hooks/trackMediaUsage'

export const Achievements: CollectionConfig = {
  slug: 'achievements',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'achievementDate', 'status', 'featured'],
    group: 'Content Management',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },
    create: editorAndAbove,
    update: editorAndAbove,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [trackActivity],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.title) {
              const base = pickLocalizedString(siblingData.title, 'en')
              if (!base) return value
              return base
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      localized: true,
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      hooks: {
        afterChange: [trackMediaUsage],
      },
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          hooks: {
            afterChange: [trackMediaUsage],
          },
        },
        {
          name: 'caption',
          type: 'text',
          localized: true,
        },
      ],
    },
    {
      name: 'achievementDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'venue',
      type: 'text',
      localized: true,
    },
    {
      name: 'organizer',
      type: 'text',
      localized: true,
    },
    {
      name: 'badge',
      type: 'text',
      localized: true,
      admin: {
        description: 'Example: Champion, Runner-up, Finalist',
      },
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
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  timestamps: true,
}

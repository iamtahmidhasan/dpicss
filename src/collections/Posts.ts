import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, authenticatedOrPublished, editorAndAbove } from '../access'
import { pickLocalizedString } from '../lib/localized-string'
import { trackMediaUsage } from '../hooks/trackMediaUsage'
import { trackActivity } from '../hooks/trackActivity'
import { invalidateCollectionCache } from '../lib/cache/optimized-fetch'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    group: 'Content Management',
  },
  access: {
    read: authenticatedOrPublished,
    create: editorAndAbove,
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      if (user?.roles?.includes('editor')) return true
      return false
    },
    delete: adminOnly,
  },
  hooks: {
    afterChange: [
      trackActivity,
      async () => {
        await invalidateCollectionCache('posts')
      },
    ],
    afterDelete: [
      async () => {
        await invalidateCollectionCache('posts')
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
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'URL-friendly identifier',
      },
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
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Short summary for previews',
      },
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
      required: true,
      admin: {
        description: 'Full post content',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Main image for the post',
      },
      hooks: {
        afterChange: [trackMediaUsage],
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: { type: { equals: 'post' } },
      admin: {
        description: 'Post category',
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
      admin: {
        description: 'Tags for better organization',
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
      defaultValue: 'published',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        condition: (data) => data.status === 'published',
        description: 'Publication date',
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            if (siblingData.status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      admin: {
        description: 'Estimated reading time in minutes',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Feature this post on homepage',
      },
    },
    {
      name: 'viewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of views',
        readOnly: true,
      },
    },
    {
      name: 'likeCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of likes',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}

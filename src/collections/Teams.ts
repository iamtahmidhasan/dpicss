import type { CollectionConfig, Where } from 'payload'
import { authenticated, adminOnly, authenticatedOrPublished, editorAndAbove } from '../access'
import { pickLocalizedString } from '../lib/localized-string'
import { trackActivity } from '../hooks/trackActivity'
import { invalidateCollectionCache } from '../lib/cache/optimized-fetch'

export const Teams: CollectionConfig = {
  slug: 'teams' as any,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'members', 'createdAt'],
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
        await invalidateCollectionCache('teams')
      },
    ],
    afterDelete: [
      async () => {
        await invalidateCollectionCache('teams')
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Team name',
      },
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
            if (!value && siblingData?.name) {
              const base = pickLocalizedString(siblingData.name, 'en')
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
      name: 'tagline',
      type: 'text',
      localized: true,
      admin: {
        description: 'Short tagline for the team',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Detailed description of the team',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Team cover image',
      },
    },
    {
      name: 'members',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      admin: {
        description: 'Select approved official members to add to this team',
      },
      filterOptions: {
        and: [
          { isActive: { equals: true } },
          {
            or: [
              { directoryApprovalStatus: { equals: 'approved' } },
              { directoryApprovalStatus: { exists: false } },
            ],
          },
        ],
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Team category',
      },
      filterOptions: { type: { equals: 'team' } },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Team visibility status',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show on homepage featured section',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Display order (lower numbers appear first)',
      },
    },
  ],
  timestamps: true,
}

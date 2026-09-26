import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, authenticatedOrPublished } from '../access'
import { trackMediaUsage } from '../hooks/trackMediaUsage'
import { trackActivity } from '../hooks/trackActivity'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'type', 'status', 'createdAt'],
    group: 'Content Management',
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [trackActivity],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
            if (!value && siblingData.name) {
              return siblingData.name
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
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Brief description of the category',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Course Category', value: 'course' },
        { label: 'Post Category', value: 'post' },
        { label: 'Team Category', value: 'team' },
        { label: 'Event Category', value: 'event' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'course',
      required: true,
      admin: {
        description: 'What this category is used for',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      admin: {
        description: 'Parent category for hierarchy',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Category thumbnail image',
      },
      hooks: {
        afterChange: [trackMediaUsage],
      },
    },
    {
      name: 'color',
      type: 'text',
      admin: {
        description: 'Hex color code for category styling (e.g., #FF5733)',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
      defaultValue: 'active',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Display order (lower numbers appear first)',
      },
    },
  ],
  timestamps: true,
}

import type { CollectionConfig } from 'payload'
import { adminOnly } from '../access'

export const Committees: CollectionConfig = {
  slug: 'committees',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'priority', 'isActive'],
    group: 'User Management',
  },
  access: {
    read: () => true,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier (e.g., governing-body, executive)',
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Admin-facing description of this committee',
      },
    },
    {
      name: 'badgeColor',
      type: 'select',
      required: true,
      defaultValue: 'slate',
      options: [
        { label: 'Amber (Governing Body)', value: 'amber' },
        { label: 'Violet (Executive)', value: 'violet' },
        { label: 'Sky (Founder)', value: 'sky' },
        { label: 'Emerald (Alumni Advisor)', value: 'emerald' },
        { label: 'Blue', value: 'blue' },
        { label: 'Rose', value: 'rose' },
        { label: 'Orange', value: 'orange' },
        { label: 'Teal', value: 'teal' },
        { label: 'Slate', value: 'slate' },
      ],
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 100,
      required: true,
      admin: {
        description: 'Higher number = higher priority in displays (top of list)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Inactive committees are hidden from member-facing views',
      },
    },
  ],
  timestamps: true,
}

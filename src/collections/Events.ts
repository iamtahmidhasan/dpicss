import type { CollectionConfig } from 'payload'
import { authenticated, adminOnly, authenticatedOrPublished, editorAndAbove } from '../access'
import { pickLocalizedString } from '../lib/localized-string'
import { trackActivity } from '../hooks/trackActivity'
import { invalidateCollectionCache } from '../lib/cache/optimized-fetch'

export const Events: CollectionConfig = {
  slug: 'events' as any,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'eventDate', 'status', 'featured', 'createdAt'],
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
        await invalidateCollectionCache('events')
      },
    ],
    afterDelete: [
      async () => {
        await invalidateCollectionCache('events')
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
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
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'eventDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Date and time of the event',
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        description: 'End date and time (optional)',
      },
    },
    {
      name: 'venue',
      type: 'text',
      localized: true,
    },
    {
      name: 'totalSeats',
      type: 'number',
      defaultValue: 100,
    },
    {
      name: 'soldSeats',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ticketPrice',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'ticketCurrency',
      type: 'select',
      defaultValue: 'BDT',
      options: [
        { label: 'BDT (Taka)', value: 'BDT' },
        { label: 'USD (Dollar)', value: 'USD' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        {
          name: 'whatsappNumber',
          type: 'text',
        },
        {
          name: 'email',
          type: 'text',
        },
      ],
    },
    {
      name: 'paymentMethods',
      type: 'array',
      admin: {
        description: 'Accepted payment methods',
      },
      fields: [
        {
          name: 'method',
          type: 'select',
          required: true,
          options: [
            { label: 'bKash', value: 'bKash' },
            { label: 'Nagad', value: 'Nagad' },
            { label: 'Rocket', value: 'Rocket' },
            { label: 'Hand to Hand Cash', value: 'hand_to_hand' },
            { label: 'Bank Transfer', value: 'bank' },
          ],
        },
        {
          name: 'accountNumber',
          type: 'text',
        },
      ],
    },
    {
      name: 'organizer',
      type: 'relationship',
      relationTo: 'members',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}

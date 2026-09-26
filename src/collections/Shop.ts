import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminOrInstructor } from '../access'
import { deleteCacheByPrefix } from '../lib/cache/redis'
import { pickLocalizedString } from '../lib/localized-string'

export const Shop: CollectionConfig = {
  slug: 'shop',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'productCategory', 'status', 'sortOrder', 'createdAt'],
    group: 'Commerce',
    description: 'Club merchandise and kits — checkout via WhatsApp',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      return { status: { equals: 'published' } }
    },
    create: isAdminOrInstructor,
    update: isAdminOrInstructor,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      async () => {
        await deleteCacheByPrefix('shop:')
      },
    ],
    afterDelete: [
      async () => {
        await deleteCacheByPrefix('shop:')
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
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
      maxLength: 320,
      admin: { description: 'Shown on product cards' },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'gallery',
      type: 'array',
      admin: { description: 'Extra product photos' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'productCategory',
      type: 'select',
      required: true,
      defaultValue: 'other',
      options: [
        { label: 'Robotics kits & parts', value: 'kits' },
        { label: 'Apparel', value: 'apparel' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Books & learning', value: 'books' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'sku',
      type: 'text',
      admin: { description: 'Optional stock keeping unit' },
    },
    {
      name: 'memberType',
      type: 'select',
      required: true,
      defaultValue: 'both',
      options: [
        { label: 'Official members only', value: 'official' },
        { label: 'Unofficial members only', value: 'unofficial' },
        { label: 'Everyone', value: 'both' },
      ],
      admin: { position: 'sidebar' },
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
          admin: { description: 'Price for official DPI members (0 = free)' },
        },
        {
          name: 'unofficialMemberPrice',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: { description: 'Price for unofficial members / public' },
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
    {
      name: 'purchaseContact',
      type: 'group',
      admin: { description: 'WhatsApp for orders (same flow as courses)' },
      fields: [
        {
          name: 'whatsappNumber',
          type: 'text',
          required: true,
          admin: {
            description: 'With country code, e.g. +8801XXXXXXXXX',
            placeholder: '+8801XXXXXXXXX',
          },
        },
        {
          name: 'whatsappMessage',
          type: 'textarea',
          admin: {
            description: 'Pre-filled message. Use {productName} or {courseName}.',
            placeholder: 'Hi, I want to buy {productName}. Please confirm availability and payment.',
          },
        },
      ],
    },
    {
      name: 'stockStatus',
      type: 'select',
      required: true,
      defaultValue: 'in_stock',
      options: [
        { label: 'In stock', value: 'in_stock' },
        { label: 'On request', value: 'on_request' },
        { label: 'Sold out', value: 'sold_out' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      admin: { description: 'Higher appears first within Latest', position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}

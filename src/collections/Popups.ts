import type { CollectionConfig } from 'payload'
import { adminOnly, editorAndAbove, anyone } from '../access'

export const Popups: CollectionConfig = {
  slug: 'popups',
  admin: {
    defaultColumns: ['imageMobile', 'imageDesktop', 'status', 'priority', 'createdAt'],
    group: 'Content Management',
  },
  access: {
    read: anyone,
    create: editorAndAbove,
    update: editorAndAbove,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.status === 'published' && !data?.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'imageMobile',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Image for mobile / vertical screens',
      },
    },
    {
      name: 'imageMobileAlt',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.imageMobile,
        description: 'Alt text for mobile image',
      },
    },
    {
      name: 'imageDesktop',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Image for desktop / horizontal screens',
      },
    },
    {
      name: 'imageDesktopAlt',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.imageDesktop,
        description: 'Alt text for desktop image',
      },
    },
    {
      name: 'link',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Higher priority popups show first (0 = lowest)',
      },
    },
    {
      name: 'displaySettings',
      type: 'group',
      fields: [
        {
          name: 'showCloseButton',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'closeOnOverlayClick',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showOncePerSession',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'If checked, popup will not show again after closing until browser session ends',
          },
        },
        {
          name: 'animation',
          type: 'select',
          options: [
            { label: 'Fade In', value: 'fade' },
            { label: 'Slide Up', value: 'slide-up' },
            { label: 'Slide Down', value: 'slide-down' },
            { label: 'Scale', value: 'scale' },
          ],
          defaultValue: 'fade',
        },
      ],
    },
    {
      name: 'targeting',
      type: 'group',
      fields: [
        {
          name: 'pageRule',
          type: 'select',
          options: [
            { label: 'All pages', value: 'all' },
            { label: 'Specific pages', value: 'specific' },
            { label: 'All except specific pages', value: 'except' },
            { label: 'Homepage only', value: 'homepage' },
            { label: 'All inner pages (not homepage)', value: 'inner' },
          ],
          defaultValue: 'all',
          required: true,
        },
        {
          name: 'specificPages',
          type: 'array',
          admin: {
            condition: (_, siblingData) =>
              siblingData?.pageRule === 'specific' || siblingData?.pageRule === 'except',
          },
          fields: [
            {
              name: 'path',
              type: 'text',
              required: true,
              admin: {
                description: 'e.g., /courses, /about, /courses/python-101',
              },
            },
          ],
        },
        {
          name: 'userRoles',
          type: 'select',
          options: [
            { label: 'All users', value: 'all' },
            { label: 'Logged out only', value: 'guest' },
            { label: 'Logged in only', value: 'authenticated' },
            { label: 'Members only', value: 'member' },
            { label: 'Admins only', value: 'admin' },
          ],
          defaultValue: 'all',
        },
      ],
    },
    {
      name: 'schedule',
      type: 'group',
      fields: [
        {
          name: 'enableSchedule',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'startDate',
          type: 'date',
          admin: {
            condition: (_, siblingData) => siblingData?.enableSchedule === true,
            description: 'Popup will start showing after this date',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            condition: (_, siblingData) => siblingData?.enableSchedule === true,
            description: 'Popup will stop showing after this date',
          },
        },
      ],
    },
  ],
  timestamps: true,
}

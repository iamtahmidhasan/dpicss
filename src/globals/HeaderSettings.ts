import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const HeaderSettings: GlobalConfig = {
  slug: 'header-settings',
  label: 'Header Settings',
  admin: {
    group: 'Site Settings',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'banner',
      type: 'group',
      admin: {
        description: 'Banner displayed at the top of the header',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'text',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'link',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
            description: 'Optional link URL when clicking the banner',
          },
        },
        {
          name: 'backgroundColor',
          type: 'select',
          options: [
            { label: 'Primary', value: 'bg-primary' },
            { label: 'Secondary', value: 'bg-secondary' },
            { label: 'Accent', value: 'bg-accent' },
            { label: 'Muted', value: 'bg-muted' },
            { label: 'Red', value: 'bg-red-600' },
            { label: 'Blue', value: 'bg-blue-600' },
            { label: 'Green', value: 'bg-green-600' },
            { label: 'Yellow', value: 'bg-yellow-600' },
            { label: 'Custom', value: 'custom' },
          ],
          defaultValue: 'bg-primary',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
        {
          name: 'customBackgroundColor',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled && siblingData?.backgroundColor === 'custom',
            description: 'Enter hex color (e.g., #ff0000)',
          },
        },
        {
          name: 'textColor',
          type: 'select',
          options: [
            { label: 'White', value: 'text-white' },
            { label: 'Black', value: 'text-black' },
            { label: 'Primary', value: 'text-primary' },
            { label: 'Muted', value: 'text-muted-foreground' },
          ],
          defaultValue: 'text-white',
          admin: {
            condition: (_, siblingData) => siblingData?.enabled,
          },
        },
      ],
    },
    {
      name: 'siteTitle',
      type: 'text',
      defaultValue: 'DPICS',
      required: true,
      localized: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Header logo image',
      },
    },
    {
      name: 'showSearch',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'menuItems',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'href',
          type: 'text',
          required: true,
        },
        {
          name: 'children',
          type: 'array',
          admin: {
            description: 'Optional dropdown menu items for this menu',
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'href',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              type: 'text',
              localized: true,
              admin: {
                description: 'Short description shown in dropdown (optional)',
              },
            },
          ],
        },
      ],
      defaultValue: [
        { label: 'Home', href: '/' },
        { label: 'Members', href: '/members' },
        {
          label: 'Learning',
          href: '/account?tab=courses',
          children: [
            { label: 'Browse Courses', href: '/posts', description: 'Explore available courses' },
            {
              label: 'My Courses',
              href: '/account?tab=courses',
              description: 'Your enrolled courses',
            },
            {
              label: 'My Certificates',
              href: '/account?tab=certificates',
              description: 'Your certificates',
            },
          ],
        },
      ],
    },
    {
      name: 'languages',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'code',
          type: 'text',
          required: true,
        },
      ],
      defaultValue: [
        { label: 'English', code: 'en' },
        { label: 'Bangla', code: 'bn' },
      ],
    },
  ],
}

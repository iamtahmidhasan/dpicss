import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const FooterSettings: GlobalConfig = {
  slug: 'footer-settings',
  label: 'Footer Settings',
  admin: {
    group: 'Site Settings',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'companyName',
      label: 'Company Name',
      type: 'text',
      required: true,
      defaultValue: 'DPICS',
      localized: true,
    },
    {
      name: 'description',
      label: 'Footer Description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Brief company or brand description that appears in the footer.',
      },
      defaultValue: 'Connecting learners and educators with a modern dashboard experience.',
    },
    {
      name: 'footerLogo',
      label: 'Footer Logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional logo shown in the footer.',
      },
    },
    {
      name: 'contactEmail',
      label: 'Contact Email',
      type: 'text',
    },
    {
      name: 'contactPhone',
      label: 'Contact Phone',
      type: 'text',
    },
    {
      name: 'officeAddress',
      label: 'Office Address',
      type: 'textarea',
    },
    {
      name: 'columns',
      label: 'Footer Columns',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'title',
          label: 'Column Title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'links',
          label: 'Links',
          type: 'array',
          minRows: 1,
          fields: [
            {
              name: 'label',
              label: 'Link Label',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'href',
              label: 'Link URL',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
      defaultValue: [
        {
          title: 'Quick Links',
          links: [
            { label: 'Home', href: '/' },
            { label: 'Members', href: '/members' },
            { label: 'Posts', href: '/posts' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'Account', href: '/account' },
            { label: 'Search', href: '/search' },
            { label: 'Profile', href: '/profile' },
          ],
        },
      ],
    },
    {
      name: 'legalLinks',
      label: 'Legal Links',
      type: 'array',
      fields: [
        {
          name: 'label',
          label: 'Label',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'href',
          label: 'URL',
          type: 'text',
          required: true,
        },
      ],
      defaultValue: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
    {
      name: 'copyrightText',
      label: 'Copyright Text',
      type: 'text',
      defaultValue: '© DPICS. All rights reserved.',
      localized: true,
      admin: {
        description: 'Displayed at the bottom of the footer.',
      },
    },
    {
      name: 'socialLinks',
      label: 'Social Media Links',
      type: 'array',
      admin: {
        description: 'Social media profiles shown in the footer.',
      },
      fields: [
        {
          name: 'platform',
          label: 'Platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Facebook Page', value: 'facebook-page' },
            { label: 'Facebook Group', value: 'facebook-group' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'GitHub', value: 'github' },
            { label: 'Discord', value: 'discord' },
            { label: 'Telegram', value: 'telegram' },
          ],
        },
        {
          name: 'url',
          label: 'URL',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}

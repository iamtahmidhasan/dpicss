import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: {
    group: 'Site Settings',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'posts',
      type: 'group',
      label: 'Posts',
      admin: {
        description: 'Default settings for blog posts',
      },
      fields: [
        {
          name: 'authorName',
          type: 'text',
          required: true,
          defaultValue: 'DPICS Team',
          admin: {
            description: 'Author name displayed on all posts',
          },
        },
        {
          name: 'authorImage',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Author avatar displayed on all posts',
          },
        },
      ],
    },
  ],
}

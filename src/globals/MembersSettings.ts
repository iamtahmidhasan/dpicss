import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const MembersSettings: GlobalConfig = {
  slug: 'members-settings',
  label: 'Members Page',
  admin: {
    group: 'Pages',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      defaultValue: 'Official Members',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      defaultValue:
        'Meet our active DPIRC community members. Click on any member to view their profile.',
    },
  ],
}

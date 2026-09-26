import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const SponsorsSettings: GlobalConfig = {
  slug: 'sponsors-settings',
  label: 'Partners & Sponsors Page',
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
      defaultValue: 'Our Partners & Sponsors',
    },
    {
      name: 'subtitle',
      type: 'textarea',
      localized: true,
      defaultValue:
        'We are grateful to the organizations that support our mission to inspire innovation and learning in robotics and technology.',
    },
    {
      name: 'empty',
      type: 'text',
      localized: true,
      defaultValue: 'No partners or sponsors yet. Check back soon!',
    },
    {
      name: 'untitled',
      type: 'text',
      localized: true,
      defaultValue: 'Sponsor',
    },
  ],
}

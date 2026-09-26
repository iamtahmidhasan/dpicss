import type { CollectionConfig } from 'payload'
import { adminOnly, authenticated } from '../access'

export const AnnouncementReads: CollectionConfig = {
  slug: 'announcement-reads',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['announcement', 'user', 'readAt', 'createdAt'],
    group: 'System',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { user: { equals: user.id } }
    },
    create: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  indexes: [{ fields: ['announcement', 'user'], unique: true }],
  fields: [
    {
      name: 'announcement',
      type: 'relationship',
      relationTo: 'announcements' as any,
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'readAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
  timestamps: true,
}

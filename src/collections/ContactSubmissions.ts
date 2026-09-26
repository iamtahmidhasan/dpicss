import type { CollectionConfig } from 'payload'
import { adminOnly, authenticatedOrPublished } from '../access'
import { trackActivity } from '../hooks/trackActivity'
import { sendContactReply } from '../hooks/sendContactReply'

export const ContactSubmissions: CollectionConfig = {
  slug: 'contact-submissions' as any,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'subject', 'status', 'createdAt'],
    group: 'Content Management',
  },
  access: {
    read: authenticatedOrPublished,
    create: () => true,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [trackActivity, sendContactReply],
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
    },
    {
      name: 'subject',
      label: 'Subject',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'unread',
      options: [
        { label: 'Unread', value: 'unread' },
        { label: 'Read', value: 'read' },
        { label: 'Replied', value: 'replied' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'reply',
      label: 'Reply',
      type: 'textarea',
      admin: {
        description: 'Your reply to this message. When you save, an email will be sent to the user.',
      },
    },
    {
      name: 'repliedAt',
      label: 'Replied At',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}

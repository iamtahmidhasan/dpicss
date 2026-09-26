import type { CollectionConfig } from 'payload'
import { adminOnly } from '../access'

export const Activities: CollectionConfig = {
  slug: 'activities',
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['user', 'action', 'collectionName', 'documentId', 'createdAt'],
    group: 'System',
  },
  access: {
    read: adminOnly,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who performed the action',
      },
    },
    {
      name: 'action',
      type: 'select',
      options: [
        { label: 'Create', value: 'create' },
        { label: 'Update', value: 'update' },
        { label: 'Delete', value: 'delete' },
        { label: 'Publish', value: 'publish' },
        { label: 'Login', value: 'login' },
        { label: 'Logout', value: 'logout' },
      ],
      required: true,
    },
    {
      name: 'collectionName',
      type: 'text',
      required: true,
      admin: {
        description: 'Collection affected',
      },
    },
    {
      name: 'documentId',
      type: 'text',
      required: true,
      admin: {
        description: 'Document ID affected',
      },
    },
    {
      name: 'documentTitle',
      type: 'text',
      admin: {
        description: 'Display title of the document',
      },
    },
    {
      name: 'changes',
      type: 'json',
      admin: {
        description: 'JSON snapshot of what changed',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'IP address of the request',
      },
    },
    {
      name: 'userAgent',
      type: 'textarea',
      admin: {
        description: 'User agent string',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'success',
    },
    {
      name: 'details',
      type: 'textarea',
      admin: {
        description: 'Additional details or error messages',
      },
    },
  ],
  timestamps: true,
}

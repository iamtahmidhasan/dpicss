import type { CollectionConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const EnrollmentRequests: CollectionConfig = {
  slug: 'enrollment-requests',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['course', 'email', 'status', 'createdAt'],
    group: 'Learning Management',
    description: 'Course enrollment requests pending admin review',
  },
  access: {
    read: adminOnly,
    create: anyone,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      admin: { description: 'Course being requested' },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: { description: 'User email' },
    },
    {
      name: 'fullName',
      type: 'text',
      required: true,
      admin: { description: 'User full name' },
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: { description: 'Phone number' },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      options: [
        { label: 'bKash', value: 'bkash' },
        { label: 'Nagad', value: 'nagad' },
        { label: 'Rocket', value: 'rocket' },
        { label: 'Bank Transfer', value: 'bank' },
        { label: 'Cash', value: 'cash' },
      ],
    },
    {
      name: 'transactionId',
      type: 'text',
      required: true,
      admin: { description: 'Payment transaction ID' },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Additional user notes' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      admin: { description: 'Admin notes about this request', position: 'sidebar' },
    },
  ],
  timestamps: true,
}
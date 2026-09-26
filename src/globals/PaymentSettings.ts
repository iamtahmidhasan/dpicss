import type { GlobalConfig } from 'payload'

export const PaymentSettings: GlobalConfig = {
  slug: 'paymentSettings',
  label: 'Payment Settings',
  admin: {
    group: 'Site Settings',
    description: 'Configure default payment information for course enrollments',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => {
      return user?.roles?.includes('admin') ?? false
    },
  },
  fields: [
    {
      name: 'bkash',
      type: 'group',
      label: 'bKash',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable bKash',
        },
        {
          name: 'number',
          type: 'text',
          label: 'bKash Number',
          admin: { description: 'Payment number (e.g., 01XXXXXXXXX)' },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Account Type',
          options: [
            { label: 'Personal', value: 'personal' },
            { label: 'Merchant', value: 'merchant' },
          ],
          defaultValue: 'personal',
        },
      ],
    },
    {
      name: 'nagad',
      type: 'group',
      label: 'Nagad',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable Nagad',
        },
        {
          name: 'number',
          type: 'text',
          label: 'Nagad Number',
          admin: { description: 'Payment number (e.g., 01XXXXXXXXX)' },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Account Type',
          options: [
            { label: 'Personal', value: 'personal' },
            { label: 'Merchant', value: 'merchant' },
          ],
          defaultValue: 'personal',
        },
      ],
    },
    {
      name: 'rocket',
      type: 'group',
      label: 'Rocket',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable Rocket',
        },
        {
          name: 'number',
          type: 'text',
          label: 'Rocket Number',
          admin: { description: 'Payment number (e.g., 01XXXXXXXXX)' },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Account Type',
          options: [
            { label: 'Personal', value: 'personal' },
            { label: 'Merchant', value: 'merchant' },
          ],
          defaultValue: 'personal',
        },
      ],
    },
    {
      name: 'cash',
      type: 'group',
      label: 'Cash Payment',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Enable Cash Payment',
        },
        {
          name: 'instructions',
          type: 'textarea',
          label: 'Cash Payment Instructions',
          admin: { description: 'Instructions for cash payment (e.g., office address, contact)' },
        },
      ],
    },
    {
      name: 'bank',
      type: 'group',
      label: 'Bank Transfer',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Enable Bank Transfer',
        },
        {
          name: 'accountName',
          type: 'text',
          label: 'Account Name',
        },
        {
          name: 'accountNumber',
          type: 'text',
          label: 'Account Number',
        },
        {
          name: 'bankName',
          type: 'text',
          label: 'Bank Name',
        },
        {
          name: 'branch',
          type: 'text',
          label: 'Branch Name',
        },
        {
          name: 'routing',
          type: 'text',
          label: 'Routing Number',
        },
      ],
    },
  ],
}

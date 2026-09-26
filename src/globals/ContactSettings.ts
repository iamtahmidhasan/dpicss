import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const ContactSettings: GlobalConfig = {
  slug: 'contact-settings',
  label: 'Contact Settings',
  admin: {
    group: 'Site Settings',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'title',
      label: 'Page Title',
      type: 'text',
      localized: true,
      defaultValue: 'Contact Us',
    },
    {
      name: 'description',
      label: 'Page Description',
      type: 'textarea',
      localized: true,
      defaultValue: 'Get in touch with us for any inquiries or questions.',
    },
    {
      name: 'mapEmbedUrl',
      label: 'Google Maps Embed URL',
      type: 'text',
      admin: {
        description: 'Paste your Google Maps embed iframe URL here',
      },
    },
    {
      name: 'officeAddress',
      label: 'Office Address',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'googleMapLink',
      label: 'Google Maps Link',
      type: 'text',
      admin: {
        description: 'Link to open Google Maps in a new tab',
      },
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'text',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
    },
    {
      name: 'whatsapp',
      label: 'WhatsApp Number',
      type: 'text',
      admin: {
        description: 'WhatsApp number with country code (e.g., +880 1234 567890)',
      },
    },
    {
      name: 'socialLinks',
      label: 'Social Media Links',
      type: 'array',
      fields: [
        {
          name: 'platform',
          label: 'Platform',
          type: 'select',
          options: [
            { label: 'Facebook', value: 'facebook' },
            { label: 'Twitter', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'GitHub', value: 'github' },
          ],
        },
        {
          name: 'url',
          label: 'Profile URL',
          type: 'text',
          required: true,
        },
        {
          name: 'icon',
          label: 'Icon Name',
          type: 'text',
          admin: {
            description: 'Lucide icon name (e.g., Facebook, Twitter, Instagram)',
          },
        },
      ],
    },
    {
      name: 'receiveEmail',
      label: 'Receive Email Notifications',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Receive email notifications when someone submits the contact form',
      },
    },
    {
      name: 'notificationEmail',
      label: 'Notification Email',
      type: 'text',
      admin: {
        description: 'Email address to receive contact form submissions',
      },
    },
    {
      name: 'faqSection',
      label: 'FAQ Section',
      type: 'group',
      fields: [
        {
          name: 'enable',
          label: 'Show FAQ Section',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'title',
          label: 'Section Title',
          type: 'text',
          localized: true,
          defaultValue: 'Frequently Asked Questions',
        },
        {
          name: 'faqs',
          label: 'Frequently Asked Questions',
          type: 'array',
          fields: [
            {
              name: 'question',
              label: 'Question',
              type: 'text',
              localized: true,
              required: true,
            },
            {
              name: 'answer',
              label: 'Answer',
              type: 'textarea',
              localized: true,
              required: true,
            },
          ],
        },
      ],
    },
  ],
}

import type { GlobalConfig } from 'payload'
import { adminOnly, anyone } from '../access'

export const RegistrationSettings: GlobalConfig = {
  slug: 'registration-settings',
  label: 'Registration Settings',
  admin: {
    group: 'Site Settings',
  },
  access: {
    read: anyone,
    update: adminOnly,
  },
  fields: [
    {
      name: 'registrationEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Enable Public Registration',
      admin: {
        description: 'When enabled, users can register from the /register page. When disabled, the registration page will be locked.',
      },
    },
    {
      name: 'lockedMessage',
      type: 'textarea',
      label: 'Locked Message',
      admin: {
        description: 'Message to show when registration is locked',
        condition: (_, siblingData) => siblingData?.registrationEnabled === false,
      },
      defaultValue: 'Registration is currently disabled. Please contact the administrator for access.',
    },
    {
      name: 'allowOfficialRegistration',
      type: 'checkbox',
      defaultValue: true,
      label: 'Allow Official Member Registration',
      admin: {
        description: 'When enabled, users can register as official DPICS members.',
      },
    },
    {
      name: 'allowUnofficialRegistration',
      type: 'checkbox',
      defaultValue: true,
      label: 'Allow Unofficial Member Registration',
      admin: {
        description: 'When enabled, users can register as unofficial members.',
      },
    },
    {
      name: 'oneTimeProfilePicture',
      type: 'checkbox',
      defaultValue: true,
      label: 'One-Time Profile Picture Upload',
      admin: {
        description:
          'When enabled, users can upload a profile picture only once from the account page. When disabled, users can change their profile picture any number of times.',
      },
    },
    {
      name: 'registrationBatch',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 1,
      label: 'Registration Batch Number',
      admin: {
        description:
          'Batch number for new member IDs (e.g., 1 → DPIRC-M1-XXXX, 2 → DPIRC-M2-XXXX). The sequence resets per batch.',
      },
    },
    {
      name: 'registrationYear',
      type: 'number',
      required: true,
      defaultValue: 25,
      min: 0,
      max: 99,
      label: 'Registration Year (2-digit)',
      admin: {
        description:
          'Two-digit year for member IDs (e.g., 25 for 2025, 26 for 2026). Format: DPIRC-M{batch}-{year}{seq}',
      },
    },
  ],
}
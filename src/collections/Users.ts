import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, adminPanelAccess, selfOrAdminField } from '../access'
import { trackActivity } from '../hooks/trackActivity'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles', 'createdAt'],
    group: 'User Management',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { id: { equals: user.id } }
    },
    create: adminOnly,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { id: { equals: user.id } }
    },
    delete: adminOnly,
    admin: adminPanelAccess,
  },
  auth: {
    // Restrict admin access to non-members
    maxLoginAttempts: 5,
    tokenExpiration: 60 * 60 * 24 * 30,
  },
  hooks: {
    beforeLogin: [
      async ({ user }) => {
        if (!user.isVerified) {
          throw new Error('Please verify your account first')
        }
      },
    ],
    afterChange: [trackActivity],
  },
  fields: [
    // Email added by default
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Instructor', value: 'instructor' },
        { label: 'Editor', value: 'editor' },
        { label: 'Member', value: 'member' },
        { label: 'Official Member', value: 'official_member' },
        { label: 'Unofficial Member', value: 'unofficial_member' },
      ],
      defaultValue: ['member'],
      required: true,
      saveToJWT: true,
      access: {
        update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      },
      admin: {
        description:
          'Admin: Full access | Instructor: Manage own courses | Editor: Create/edit content | Member: Access courses only',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      saveToJWT: true,
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Disable to prevent login',
      },
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Last successful login',
      },
    },
    {
      name: 'isVerified',
      type: 'checkbox',
      defaultValue: false,
      saveToJWT: true,
      admin: {
        description: 'Email/OTP verification status',
      },
    },
    {
      name: 'memberCategory',
      type: 'select',
      options: [
        { label: 'Official Member', value: 'official' },
        { label: 'Unofficial Member', value: 'unofficial' },
      ],
      defaultValue: 'unofficial',
      saveToJWT: true,
      admin: {
        description:
          'Official members are linked to Members; others are linked to Unofficial Members.',
      },
    },
    {
      name: 'officialMemberProfile',
      type: 'relationship',
      relationTo: 'members',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Linked profile for official DPIRC members',
      },
    },
    {
      name: 'unofficialMemberProfile',
      type: 'relationship',
      relationTo: 'unofficial-members',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Linked profile for unofficial members',
      },
    },
    {
      name: 'otp',
      type: 'text',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpExpiry',
      type: 'date',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'otpAttempts',
      type: 'number',
      defaultValue: 0,
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'passwordResetToken',
      type: 'text',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'passwordResetExpiry',
      type: 'date',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'googleId',
      type: 'text',
      access: {
        read: adminOnlyField,
        update: adminOnlyField,
      },
      admin: {
        hidden: true,
      },
    },
    {
      name: 'authProvider',
      type: 'select',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Google', value: 'google' },
      ],
      defaultValue: 'email',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Authentication method used by this user',
      },
    },
    {
      name: 'googlePicture',
      type: 'text',
      access: {
        read: selfOrAdminField,
        update: adminOnlyField,
      },
      saveToJWT: true,
      admin: {
        description: 'Profile picture from Google',
      },
    },
  ],
}

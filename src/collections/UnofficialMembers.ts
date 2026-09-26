import type { Access, CollectionConfig, PayloadRequest, Where } from 'payload'
import { adminOnly, adminOnlyField } from '../access'
import { notifyComplaintReceived } from '../hooks/notifyComplaint'

const ownUnofficialProfileWhere = (userId: string, userEmail?: string): Where => {
  if (!userEmail) {
    return { user: { equals: userId } }
  }

  return {
    or: [{ user: { equals: userId } }, { email: { equals: userEmail } }],
  }
}

const readUnofficialMembers: Access = ({ req: { user } }) => {
  if (!user) return false
  if (
    user.roles?.includes('admin') ||
    user.roles?.includes('editor') ||
    user.roles?.includes('instructor')
  ) {
    return true
  }

  return ownUnofficialProfileWhere(user.id, user.email)
}

const updateUnofficialMembers: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return ownUnofficialProfileWhere(user.id, user.email)
}

const canUpdateComplaints = ({ req }: { req: PayloadRequest }): boolean => {
  return Boolean(req.user?.roles?.includes('admin'))
}

export const UnofficialMembers: CollectionConfig = {
  slug: 'unofficial-members',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'institutionName', 'status', 'createdAt'],
    group: 'User Management',
  },
  access: {
    read: readUnofficialMembers,
    create: adminOnly,
    update: updateUnofficialMembers,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc }) => {
        await notifyComplaintReceived({ doc, previousDoc })
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Linked user account',
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: true,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'manualCertificates',
      type: 'array',
      access: {
        update: adminOnlyField,
      },
      admin: {
        description: 'Manually issued certificates with unique IDs for verification',
      },
      fields: [
        {
          name: 'certificateId',
          type: 'text',
          required: true,
          admin: {
            description: 'Unique certificate ID for verification',
          },
        },
        {
          name: 'course',
          type: 'relationship',
          relationTo: 'courses',
          required: true,
          admin: {
            description: 'Course for this certificate',
          },
        },
        {
          name: 'certificateImageUrl',
          type: 'text',
          admin: {
            description: 'Public image URL for the issued certificate',
          },
        },
      ],
    },
    {
      name: 'complaints',
      type: 'array',
      access: {
        update: canUpdateComplaints,
      },
      admin: {
        description: 'Admin-entered complaints and warnings',
      },
      fields: [
        {
          name: 'message',
          type: 'textarea',
          // required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Submitted', value: 'submitted' },
            { label: 'In Review', value: 'in_review' },
            { label: 'Resolved', value: 'resolved' },
          ],
          defaultValue: 'submitted',
          access: {
            update: adminOnlyField,
          },
        },
        {
          name: 'createdAt',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          access: {
            update: canUpdateComplaints,
          },
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profile picture',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Short biography',
      },
    },
    {
      name: 'institutionName',
      type: 'text',
      // required: true,
      admin: {
        description: 'Institution / University / Organization',
      },
    },
    {
      name: 'department',
      type: 'text',
      admin: {
        description: 'Department, major, or team name',
      },
    },
    {
      name: 'submissionDetails',
      type: 'textarea',
      // required: true,
      admin: {
        description: 'Why the user wants to join and any supporting details',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      defaultValue: 'pending',
      required: true,
      access: {
        update: adminOnlyField,
      },
    },
  ],
  timestamps: true,
}

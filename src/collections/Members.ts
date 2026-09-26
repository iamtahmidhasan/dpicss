import type { CollectionConfig, Where } from 'payload'
import crypto from 'crypto'
import { adminOnly, adminOnlyField } from '../access'
import { trackMediaUsage } from '../hooks/trackMediaUsage'
import { trackActivity } from '../hooks/trackActivity'
import { notifyComplaintReceived } from '../hooks/notifyComplaint'
import { notifyN8nRegistration } from '../hooks/notifyN8nRegistration'
import { sendMemberWelcomeEmail } from '../lib/mail'
import { invalidateCollectionCache } from '../lib/cache/optimized-fetch'
import type { PayloadRequest } from 'payload'
import { withPayloadTransaction } from '../lib/payload-transaction'
import { formatMemberFullName } from '../lib/member-name'

const toUsernameBase = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const canUpdateComplaints = ({ req }: { req: PayloadRequest }): boolean => {
  return Boolean(req.user?.roles?.includes('admin'))
}

async function getNextMemberSequence(
  req: PayloadRequest,
  batch: number,
): Promise<number> {
  const pattern = `^DPIRC-M${batch}-\\d{2}(\\d{3})$`
  const regex = new RegExp(pattern)

  const { docs } = await req.payload.find({
    collection: 'members',
    select: { memberId: true },
    limit: 10000,
    sort: 'createdAt',
    overrideAccess: true,
    depth: 0,
  })

  const usedNumbers = new Set<number>()
  for (const doc of docs) {
    const mid = String((doc as any).memberId || '')
    const match = mid.match(regex)
    if (match) {
      usedNumbers.add(parseInt(match[1], 10))
    }
  }

  let seq = 1
  while (usedNumbers.has(seq)) {
    seq++
  }

  return seq
}

export const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    useAsTitle: 'memberId',
    defaultColumns: [
      'memberId',
      'firstName',
      'lastName',
      'email',
      'directoryApprovalStatus',
      'memberType',
      'createdAt',
    ],
    group: 'User Management',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      if (user?.roles?.includes('editor')) return true
      if (user?.roles?.includes('instructor')) return true

      const listedOfficial: Where = {
        and: [
          { isActive: { equals: true } },
          {
            or: [
              { directoryApprovalStatus: { equals: 'approved' } },
              { directoryApprovalStatus: { exists: false } },
            ],
          },
        ],
      }

      if (user?.id) {
        return {
          or: [listedOfficial, { user: { equals: user.id } }],
        }
      }

      return listedOfficial
    },
    create: adminOnly,
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true
      // Members can edit their own profile
      return { user: { equals: user?.id } }
    },
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && !data.memberId) {
          const settings = await (req.payload as any).findGlobal({
            slug: 'registration-settings' as const,
            overrideAccess: true,
            depth: 0,
          }).catch(() => ({ registrationBatch: 1, registrationYear: 25 }))
          const batch = (settings as any)?.registrationBatch ?? 1
          const year = String((settings as any)?.registrationYear ?? new Date().getFullYear() % 100).padStart(2, '0')
          const nextSeq = await getNextMemberSequence(req, batch)
          data.memberId = `DPIRC-M${batch}-${year}${String(nextSeq).padStart(3, '0')}`
        }

        // Backfill / enforce username for old and new records with stable unique suffix.
        if (!data.username) {
          const first = typeof data.firstName === 'string' ? data.firstName : ''
          const last = typeof data.lastName === 'string' ? data.lastName : ''
          const fallback =
            typeof data.memberId === 'string' ? data.memberId.toLowerCase() : 'member'
          const base = toUsernameBase(`${first}-${last}`) || toUsernameBase(fallback) || 'member'
          const memberSuffix =
            toUsernameBase(String(data.memberId || '')) || crypto.randomBytes(6).toString('hex')

          data.username = `${base}-${memberSuffix}`
        }
        return data
      },
      async ({ data, req }) => {
        const raw = data.avatar
        const avatarId =
          typeof raw === 'string' && raw.length > 0
            ? raw
            : raw &&
                typeof raw === 'object' &&
                raw !== null &&
                'id' in raw &&
                (raw as { id: unknown }).id != null
              ? String((raw as { id: unknown }).id)
              : null
        if (!avatarId) return data

        try {
          await withPayloadTransaction(req, async () => {
            await req.payload.update({
              collection: 'media',
              id: avatarId,
              data: { usage: 'profile' },
              req,
              overrideAccess: true,
            })
          })
        } catch (err) {
          req.payload.logger.warn(
            `[Members] Could not mark avatar media ${avatarId} as usage=profile: ${err}`,
          )
        }
        return data
      },
      async ({ data, operation, req }) => {
        // Migration: auto-populate committeeRoles from legacy checkbox fields
        if (operation !== 'update') return data

        const hasLegacyFlags =
          data.isFounder !== undefined ||
          data.isAlumniAdvisor !== undefined ||
          data.isGoverningBody !== undefined ||
          data.isExecutive !== undefined

        const alreadyMigrated = Array.isArray(data.committeeRoles) && data.committeeRoles.length > 0

        if (!hasLegacyFlags || alreadyMigrated) return data

        const flagToSlug: Record<string, string> = {
          isFounder: 'founder',
          isAlumniAdvisor: 'alumni-advisor',
          isGoverningBody: 'governing-body',
          isExecutive: 'executive',
        }

        const slugToFlag: Record<string, { flag: string; label: string }> = {
          founder: { flag: 'isFounder', label: 'Founder' },
          'alumni-advisor': { flag: 'isAlumniAdvisor', label: 'Alumni Advisor' },
          'governing-body': { flag: 'isGoverningBody', label: 'Governing Body' },
          executive: { flag: 'isExecutive', label: 'Executive' },
        }

        const committeeRoles: Array<{ committee: string; role?: string }> = []

        for (const [slug, info] of Object.entries(slugToFlag)) {
          if (!data[info.flag]) continue

          const { docs } = await req.payload.find({
            collection: 'committees',
            where: { slug: { equals: slug } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          if (docs.length > 0) {
            committeeRoles.push({ committee: String(docs[0].id) })
          } else {
            // Auto-create the committee if it doesn't exist yet
            const created = await req.payload.create({
              collection: 'committees',
              data: {
                name: info.label,
                slug,
                badgeColor: slug === 'governing-body' ? 'amber' : slug === 'executive' ? 'violet' : slug === 'founder' ? 'sky' : 'emerald',
                priority: slug === 'governing-body' ? 4 : slug === 'executive' ? 3 : slug === 'founder' ? 2 : 1,
                isActive: true,
              },
              req,
              overrideAccess: true,
            })
            committeeRoles.push({ committee: String(created.id) })
          }
        }

        if (committeeRoles.length > 0) {
          data.committeeRoles = committeeRoles
        }

        // Clear legacy flags so they aren't re-migrated
        delete data.isFounder
        delete data.isAlumniAdvisor
        delete data.isGoverningBody
        delete data.isExecutive

        return data
      },
    ],
    afterChange: [
      trackActivity,
      async ({ doc, previousDoc, operation, req }) => {
        await invalidateCollectionCache('members')

        if (operation !== 'update' || !doc?.email) return doc

        const prevStatus = previousDoc?.directoryApprovalStatus
        const nextStatus = doc.directoryApprovalStatus

        if (prevStatus === 'pending' && nextStatus === 'approved') {
          try {
            await sendMemberWelcomeEmail(String(doc.email), String(doc.firstName || ''))
          } catch (err) {
            req.payload.logger.error(`[Members] Welcome email failed for ${doc.email}: ${err}`)
          }
        }

        return doc
      },
      async ({ doc, previousDoc }) => {
        await notifyComplaintReceived({ doc, previousDoc })
      },
      notifyN8nRegistration,
    ],
    afterDelete: [
      async () => {
        await invalidateCollectionCache('members')
      },
    ],
  },
  fields: [
    {
      name: 'memberId',
      type: 'text',
      required: true,
      unique: true,
      access: {
        update: ({ req: { user } }) => {
          if (user?.roles?.includes('admin')) return true
          return false
        },
      },
      admin: {
        description: 'Unique member identifier for verification (auto-generated on create)',
      },
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Public unique username used for profile URL (/profile/[username])',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      unique: true,
      admin: {
        description: 'Associated user account',
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
      name: 'fullName',
      type: 'text',
      virtual: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            const firstName = siblingData?.firstName || ''
            const lastName = siblingData?.lastName || ''
            return formatMemberFullName(firstName, lastName)
          },
        ],
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      admin: {
        description: 'Contact email',
      },
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
          required: true,
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
      hooks: {
        afterChange: [trackMediaUsage],
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
      name: 'memberType',
      type: 'select',
      options: [
        { label: 'Student', value: 'student' },
        { label: 'Instructor', value: 'instructor' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'student',
      required: true,
    },
    {
      name: 'skills',
      type: 'array',
      fields: [
        {
          name: 'skill',
          type: 'text',
          required: true,
        },
        {
          name: 'level',
          type: 'select',
          options: [
            { label: 'Beginner', value: 'beginner' },
            { label: 'Intermediate', value: 'intermediate' },
            { label: 'Advanced', value: 'advanced' },
          ],
          defaultValue: 'beginner',
        },
      ],
      admin: {
        description: 'Technical skills and proficiency levels',
      },
    },
    {
      name: 'socialLinks',
      type: 'group',
      fields: [
        {
          name: 'facebook',
          type: 'text',
          admin: {
            description: 'Facebook profile URL',
            placeholder: 'https://facebook.com/username',
          },
        },
        {
          name: 'whatsapp',
          type: 'text',
          admin: {
            description: 'WhatsApp number with country code',
            placeholder: '+8801234567890',
          },
        },
        {
          name: 'linkedin',
          type: 'text',
          admin: {
            description: 'LinkedIn profile URL',
            placeholder: 'https://linkedin.com/in/username',
          },
        },
        {
          name: 'github',
          type: 'text',
          admin: {
            description: 'GitHub profile URL',
            placeholder: 'https://github.com/username',
          },
        },
        {
          name: 'website',
          type: 'text',
          admin: {
            description: 'Personal website or portfolio',
            placeholder: 'https://example.com',
          },
        },
      ],
      admin: {
        description: 'Social media and contact links',
      },
    },
    {
      name: 'enrolledCourses',
      type: 'relationship',
      relationTo: 'enrollments',
      hasMany: true,
      admin: {
        description: 'Courses this member is enrolled in',
      },
    },
    {
      name: 'completedCourses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      admin: {
        description: 'Courses completed by this member',
      },
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
      name: 'certificates',
      type: 'array',
      fields: [
        {
          name: 'course',
          type: 'relationship',
          relationTo: 'courses',
          required: true,
        },
        {
          name: 'issuedDate',
          type: 'date',
          required: true,
        },
        {
          name: 'certificateUrl',
          type: 'text',
          admin: {
            description: 'URL to certificate PDF or image',
          },
        },
      ],
      admin: {
        description: 'Certificates earned',
      },
    },
    {
      name: 'level',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Member level',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this member account is active',
      },
    },
    {
      name: 'committeeRoles',
      type: 'array',
      admin: {
        description: 'Committee memberships and roles',
      },
      fields: [
        {
          name: 'committee',
          type: 'relationship',
          relationTo: 'committees',
          required: true,
        },
        {
          name: 'role',
          type: 'text',
          admin: {
            description: 'Role within the committee (e.g., President, Treasurer)',
          },
        },
      ],
    },
    {
      name: 'directoryApprovalStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending admin approval', value: 'pending' },
        { label: 'Approved (public directory)', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      access: {
        update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
      },
      admin: {
        description:
          'Self-serve official signups start as pending; admins approve before the profile appears in /members.',
      },
    },
    // Official member registration details (not required in DB, required in form)
    {
      name: 'hasPaidRegistration',
      type: 'checkbox',
      admin: {
        description: 'Whether member has paid registration fee',
      },
    },
    {
      name: 'paymentMethod',
      type: 'select',
      options: [
        { label: 'bKash', value: 'bkash' },
        { label: 'Nagad', value: 'nagad' },
        { label: 'Rocket', value: 'rocket' },
        { label: 'Hand to Hand Cash', value: 'hand_to_hand' },
        { label: 'Bank Transfer', value: 'bank' },
      ],
      admin: {
        description: 'Payment method used for registration (only if hasPaidRegistration=true)',
      },
    },
    {
      name: 'paymentTransactionId',
      type: 'text',
      admin: {
        description: 'Transaction ID for payment (not needed for cash)',
      },
    },
    {
      name: 'senderNumber',
      type: 'text',
      admin: {
        description: 'Sender mobile banking number used for payment',
      },
    },
    {
      name: 'paymentNotes',
      type: 'textarea',
      admin: {
        description: 'Additional notes related to payment',
      },
    },
    {
      name: 'group',
      type: 'text',
      admin: {
        description: 'Member group (e.g., 1/1/CST/A)',
      },
    },
    {
      name: 'whatsappNumber',
      type: 'text',
      admin: {
        description: 'WhatsApp contact number',
      },
    },
    {
      name: 'phoneNumber',
      type: 'text',
      admin: {
        description: 'Phone contact number',
      },
    },
    {
      name: 'boardRoll',
      type: 'text',
      admin: {
        description: 'Board roll number (or class roll if not available)',
      },
    },
    {
      name: 'season',
      type: 'text',
      admin: {
        description: 'Season or batch information',
      },
    },
    {
      name: 'bloodGroup',
      type: 'select',
      options: [
        { label: 'A+', value: 'a_plus' },
        { label: 'A-', value: 'a_minus' },
        { label: 'B+', value: 'b_plus' },
        { label: 'B-', value: 'b_minus' },
        { label: 'AB+', value: 'ab_plus' },
        { label: 'AB-', value: 'ab_minus' },
        { label: 'O+', value: 'o_plus' },
        { label: 'O-', value: 'o_minus' },
      ],
      admin: {
        description: 'Blood group',
      },
    },
    {
      name: 'nidOrBirthCertificate',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'NID or Birth Certificate copy',
      },
      hooks: {
        afterChange: [trackMediaUsage],
      },
    },
    {
      name: 'studentIdCard',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Student ID Card (optional)',
      },
      hooks: {
        afterChange: [trackMediaUsage],
      },
    },
    {
      name: 'passportSizeImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Passport size profile image',
      },
      hooks: {
        afterChange: [trackMediaUsage],
      },
    },
  ],
  timestamps: true,
}

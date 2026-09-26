import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayloadWithRetry } from '@/lib/payload-safe'

import { AccountPageClient } from '@/components/account-page-client'
import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { getMessages } from '@/messages'

type AccountProfile = {
  memberId?: string
  avatar?: { url?: string }
  firstName?: string
  lastName?: string
  bio?: string
  institutionName?: string
  department?: string
  submissionDetails?: string
  completedCourses?: Array<{ title?: string }>
  directoryApprovalStatus?: string
  memberType?: string
  committeeRoles?: Array<{ committee?: { id?: string; name?: string }; role?: string }>
  isActive?: boolean
  // Official member registration details
  hasPaidRegistration?: boolean
  paymentMethod?: string
  paymentTransactionId?: string
  senderNumber?: string
  paymentNotes?: string
  group?: string
  whatsappNumber?: string
  phoneNumber?: string
  boardRoll?: string
  season?: string
  bloodGroup?: string
  nidOrBirthCertificate?: { url?: string; id?: string }
  studentIdCard?: { url?: string; id?: string }
  passportSizeImage?: { url?: string; id?: string }
  manualCertificates?: Array<{
    certificateId?: string
    course?: { id?: string; title?: string }
    certificateImageUrl?: string
  }>
  complaints?: Array<{ message?: string; status?: string; createdAt?: string }>
  skills?: Array<{ skill?: string; level?: string }>
  socialLinks?: {
    facebook?: string
    whatsapp?: string
    linkedin?: string
    github?: string
    website?: string
  }
}

type AnnouncementSummary = {
  id: string
  title?: string
  summary?: string
  content?: unknown
  publishedAt?: string
}

function normalizeProfile(raw: unknown): AccountProfile | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const profile = raw as Record<string, unknown>
  const rawAvatar = profile.avatar
  let avatar: { url?: string } | undefined

  if (typeof rawAvatar === 'string') {
    avatar = { url: rawAvatar }
  } else if (rawAvatar && typeof rawAvatar === 'object') {
    avatar = { url: String((rawAvatar as Record<string, unknown>).url ?? '') }
  }

  const completedCourses = Array.isArray(profile.completedCourses)
    ? profile.completedCourses.map((item) => {
        if (item && typeof item === 'object') {
          return { title: String((item as Record<string, unknown>).title ?? '') }
        }
        return { title: String(item ?? '') }
      })
    : undefined

  // Helper to normalize media/upload fields
  const normalizeMediaField = (field: unknown): { url?: string; id?: string } | undefined => {
    if (!field) return undefined
    if (typeof field === 'string') return { url: field, id: field }
    if (field && typeof field === 'object') {
      const obj = field as Record<string, unknown>
      return {
        url: String(obj.url ?? obj.filename ?? ''),
        id: String(obj.id ?? ''),
      }
    }
    return undefined
  }

  return {
    memberId: typeof profile.memberId === 'string' ? profile.memberId : undefined,
    avatar,
    firstName: typeof profile.firstName === 'string' ? profile.firstName : undefined,
    lastName: typeof profile.lastName === 'string' ? profile.lastName : undefined,
    bio: typeof profile.bio === 'string' ? profile.bio : undefined,
    institutionName:
      typeof profile.institutionName === 'string' ? profile.institutionName : undefined,
    department: typeof profile.department === 'string' ? profile.department : undefined,
    submissionDetails:
      typeof profile.submissionDetails === 'string' ? profile.submissionDetails : undefined,
    completedCourses,
    directoryApprovalStatus:
      typeof profile.directoryApprovalStatus === 'string'
        ? profile.directoryApprovalStatus
        : undefined,
    memberType: typeof profile.memberType === 'string' ? profile.memberType : undefined,
    committeeRoles: Array.isArray(profile.committeeRoles) ? profile.committeeRoles : undefined,
    isActive: typeof profile.isActive === 'boolean' ? profile.isActive : undefined,
    // Official member registration details
    hasPaidRegistration:
      typeof profile.hasPaidRegistration === 'boolean' ? profile.hasPaidRegistration : undefined,
    paymentMethod: typeof profile.paymentMethod === 'string' ? profile.paymentMethod : undefined,
    paymentTransactionId:
      typeof profile.paymentTransactionId === 'string' ? profile.paymentTransactionId : undefined,
    senderNumber: typeof profile.senderNumber === 'string' ? profile.senderNumber : undefined,
    paymentNotes: typeof profile.paymentNotes === 'string' ? profile.paymentNotes : undefined,
    group: typeof profile.group === 'string' ? profile.group : undefined,
    whatsappNumber: typeof profile.whatsappNumber === 'string' ? profile.whatsappNumber : undefined,
    phoneNumber: typeof profile.phoneNumber === 'string' ? profile.phoneNumber : undefined,
    boardRoll: typeof profile.boardRoll === 'string' ? profile.boardRoll : undefined,
    season: typeof profile.season === 'string' ? profile.season : undefined,
    bloodGroup: typeof profile.bloodGroup === 'string' ? profile.bloodGroup : undefined,
    nidOrBirthCertificate: normalizeMediaField(profile.nidOrBirthCertificate),
    studentIdCard: normalizeMediaField(profile.studentIdCard),
    passportSizeImage: normalizeMediaField(profile.passportSizeImage),
    manualCertificates: Array.isArray(profile.manualCertificates)
      ? profile.manualCertificates.map((item): { certificateId?: string; course?: { id?: string; title?: string }; certificateImageUrl?: string } => {
          if (!item || typeof item !== 'object') return {}
          const entry = item as Record<string, unknown>
          const course = entry.course && typeof entry.course === 'object'
            ? {
                id: String((entry.course as Record<string, unknown>).id ?? ''),
                title: String((entry.course as Record<string, unknown>).title ?? ''),
              }
            : undefined
          return {
            certificateId: typeof entry.certificateId === 'string' ? entry.certificateId : undefined,
            course,
            certificateImageUrl: typeof entry.certificateImageUrl === 'string' ? entry.certificateImageUrl : undefined,
          }
        })
      : undefined,
    complaints: Array.isArray(profile.complaints)
      ? (profile.complaints
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const entry = item as Record<string, unknown>
            return {
              message: typeof entry.message === 'string' ? entry.message : undefined,
              status: typeof entry.status === 'string' ? entry.status : undefined,
              createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : undefined,
            }
          })
          .filter(Boolean) as Array<{ message?: string; status?: string; createdAt?: string }>)
      : undefined,
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((item) => {
          if (item && typeof item === 'object') {
            return {
              skill: String((item as Record<string, unknown>).skill ?? ''),
              level: String((item as Record<string, unknown>).level ?? 'beginner'),
            }
          }
          return { skill: '', level: 'beginner' }
        })
      : undefined,
    socialLinks:
      profile.socialLinks && typeof profile.socialLinks === 'object'
        ? {
            facebook: String((profile.socialLinks as Record<string, unknown>).facebook ?? ''),
            whatsapp: String((profile.socialLinks as Record<string, unknown>).whatsapp ?? ''),
            linkedin: String((profile.socialLinks as Record<string, unknown>).linkedin ?? ''),
            github: String((profile.socialLinks as Record<string, unknown>).github ?? ''),
            website: String((profile.socialLinks as Record<string, unknown>).website ?? ''),
          }
        : undefined,
  }
}

export default async function AccountPage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  const requestLocale = await getRequestLocale()
  const loc: 'en' | 'bn' = requestLocale === 'bn' ? 'bn' : 'en'
  const messages = getMessages(loc)
  const locOpts = payloadLocaleOptions(loc)

  let officialProfile: AccountProfile | null = null
  let unofficialProfile: AccountProfile | null = null
  let enrollments: { docs: any[]; totalDocs: number } = { docs: [], totalDocs: 0 }
  let announcements: { docs: AnnouncementSummary[]; totalDocs: number } = { docs: [], totalDocs: 0 }
  let announcementReads: { docs: Array<{ announcement?: string | { id?: string } }> } = { docs: [] }
  let googlePicture: string | undefined

  // Check one-time profile picture setting
  const regSettings = await (payload as any).findGlobal({
    slug: 'registration-settings',
    depth: 0,
  }).catch(() => null) as { oneTimeProfilePicture?: boolean } | null
  const oneTimeProfilePicture = regSettings?.oneTimeProfilePicture === true

  // Fetch club branding for poster
  const headerSettings = await (payload as any).findGlobal({
    slug: 'header-settings',
    depth: 1,
  }).catch(() => null) as { logo?: { url?: string }; siteTitle?: string } | null
  const clubLogoUrl = typeof headerSettings?.logo === 'object' && headerSettings.logo
    ? String((headerSettings.logo as { url?: string }).url || '')
    : ''
  const clubName = headerSettings?.siteTitle?.trim() || 'DPI Computing Society'

  try {
    const userDoc = await payload.findByID({
      collection: 'users',
      id: String(user.id),
      depth: 0,
      user,
      overrideAccess: false,
      select: { googlePicture: true },
    })
    googlePicture = typeof userDoc?.googlePicture === 'string' ? userDoc.googlePicture : undefined
  } catch {
    googlePicture = undefined
  }

  if (user.memberCategory === 'official' && user.officialMemberProfile) {
    const id =
      typeof user.officialMemberProfile === 'object'
        ? String(user.officialMemberProfile.id)
        : user.officialMemberProfile
    try {
      officialProfile = normalizeProfile(
        await payload.findByID({
          collection: 'members',
          id,
          depth: 2,
          ...locOpts,
          user,
          overrideAccess: false,
        }),
      )

      // Enrollments are keyed by auth user (`student`), not member profile id
      enrollments = await payload.find({
        collection: 'enrollments',
        where: { student: { equals: user.id } },
        depth: 2,
        limit: 50,
        ...locOpts,
        user,
        overrideAccess: false,
      })
    } catch {
      officialProfile = null
    }
  }

  try {
    announcements = await (payload as any).find({
      collection: 'announcements',
      depth: 0,
      limit: 50,
      sort: '-publishedAt',
      user,
      overrideAccess: false,
    })

    announcementReads = await (payload as any).find({
      collection: 'announcement-reads',
      where: { user: { equals: user.id } },
      depth: 0,
      limit: 200,
      user,
      overrideAccess: false,
    })
  } catch {
    announcements = { docs: [], totalDocs: 0 }
    announcementReads = { docs: [] }
  }

  if (user.memberCategory === 'unofficial' && user.unofficialMemberProfile) {
    const id =
      typeof user.unofficialMemberProfile === 'object'
        ? String(user.unofficialMemberProfile.id)
        : user.unofficialMemberProfile
    try {
      unofficialProfile = normalizeProfile(
        await payload.findByID({
          collection: 'unofficial-members',
          id,
          depth: 2,
          ...locOpts,
          user,
          overrideAccess: false,
        }),
      )
    } catch {
      unofficialProfile = null
    }
  }

  return (
    <AccountPageClient
      messages={messages}
      locale={loc}
      data={{
        user: {
          email: user.email,
          roles: user.roles || [],
          memberCategory: user.memberCategory,
          isVerified: user.isVerified,
          isActive: user.isActive,
          createdAt: typeof user.createdAt === 'string' ? user.createdAt : undefined,
          googlePicture,
        },
        officialProfile: officialProfile || null,
        unofficialProfile: unofficialProfile || null,
        enrollments: enrollments.docs,
        announcements: announcements.docs,
        announcementReads: announcementReads.docs
          .map((read) => {
            const announcement = read.announcement
            if (typeof announcement === 'string') return announcement
            if (announcement && typeof announcement === 'object') {
              return String((announcement as { id?: string }).id || '')
            }
            return ''
          })
          .filter(Boolean),
        oneTimeProfilePicture,
        clubLogoUrl,
        clubName,
      }}
    />
  )
}

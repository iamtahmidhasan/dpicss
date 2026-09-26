import type { Media, User } from '@/payload-types'

export type LessonRow = {
  id?: string
  title?: string
  type?: 'video' | 'document' | 'live'
  order?: number
  duration?: string | null
  isFreePreview?: boolean
  videoUrl?: string | null
  videoFile?: string | Media | null
  documentFile?: string | Media | null
  documentContent?: unknown
  description?: string | null
  googleMeetLink?: string | null
  scheduledAt?: string | null
}

export type ModuleRow = {
  id?: string
  title?: string
  description?: string | null
  order?: number
  lessons?: LessonRow[]
}

export type ShopItem = {
  id: string
  title?: string
  slug?: string
  shortDescription?: string
  featuredImage?: string | Media | null
  productCategory?: string
  memberType?: string
  pricing?: DualMemberPricing | null
  purchaseContact?: {
    whatsappNumber?: string | null
    whatsappMessage?: string | null
  }
  stockStatus?: string
  sortOrder?: number
  isFeatured?: boolean
}

export type CourseDoc = {
  id: string
  title?: string
  slug?: string
  shortDescription?: string
  description?: unknown
  thumbnail?: string | Media | null
  level?: string
  category?: string
  enrollmentCount?: number
  averageRating?: number
  publishedAt?: string
  createdAt?: string
  duration?: { totalHours?: number | null; totalWeeks?: number | null }
  modules?: ModuleRow[]
  instructors?: (string | { id?: string })[] | null
  instructor?: string | User | null
  coInstructors?: (string | User | null)[] | null
  memberType?: string
  pricing?: {
    officialMemberPrice?: number | null
    unofficialMemberPrice?: number | null
    currency?: string | null
  }
  enrollmentContact?: {
    whatsappNumber?: string | null
    whatsappMessage?: string | null
  }
  paymentInfo?: {
    useCustomPayment?: boolean
    bkashNumber?: string
    nagadNumber?: string
    rocketNumber?: string
    cashInstructions?: string
  }
  certificateTemplate?: { issueCertificate?: boolean | null }
  learningOutcomes?: { outcome?: string }[]
  requirements?: { requirement?: string }[]
  previewVideo?: string | null
}

export function mediaUrl(media: string | Media | null | undefined): string | null {
  if (!media || typeof media === 'string') return typeof media === 'string' ? media : null
  const pluginGroup =
    'imagekit' in media && (media as { imagekit?: unknown }).imagekit
      ? ((media as { imagekit?: { url?: unknown; thumbnailUrl?: unknown } }).imagekit ?? null)
      : null
  const pluginUrl =
    pluginGroup && typeof pluginGroup.url === 'string' ? String(pluginGroup.url || '') : ''
  if (pluginUrl) return pluginUrl
  const pluginThumb =
    pluginGroup && typeof pluginGroup.thumbnailUrl === 'string'
      ? String(pluginGroup.thumbnailUrl || '')
      : ''
  if (pluginThumb) return pluginThumb
  const cloudUrl =
    'imageKitUrl' in media && typeof (media as { imageKitUrl?: unknown }).imageKitUrl === 'string'
      ? String((media as { imageKitUrl?: string }).imageKitUrl || '')
      : ''
  if (cloudUrl) return cloudUrl
  return media.url || null
}

export function instructorLabel(instructor: string | User | null | undefined): string {
  if (!instructor || typeof instructor === 'string') return 'Instructor'
  const u = instructor as User & {
    officialMemberProfile?: { firstName?: string; lastName?: string } | string | null
    unofficialMemberProfile?: { firstName?: string; lastName?: string } | string | null
  }
  const o = u.officialMemberProfile
  if (o && typeof o === 'object') {
    const n = [o.firstName, o.lastName].filter(Boolean).join(' ')
    if (n) return n
  }
  const un = u.unofficialMemberProfile
  if (un && typeof un === 'object') {
    const n = [un.firstName, un.lastName].filter(Boolean).join(' ')
    if (n) return n
  }
  return u.email || 'Instructor'
}

export type DualMemberPricing = {
  officialMemberPrice?: number | null
  unofficialMemberPrice?: number | null
  currency?: string | null
}

export function priceFromDualPricing(
  pricing: DualMemberPricing | null | undefined,
  memberCategory: 'official' | 'unofficial',
): number {
  if (!pricing) return 0
  return memberCategory === 'official'
    ? Number(pricing.officialMemberPrice ?? 0)
    : Number(pricing.unofficialMemberPrice ?? 0)
}

export function priceForMember(
  course: CourseDoc,
  memberCategory: 'official' | 'unofficial',
): number {
  return priceFromDualPricing(course.pricing, memberCategory)
}

export function totalLessonCount(modules: ModuleRow[] | undefined): number {
  if (!modules?.length) return 0
  return modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)
}

/** Replaces `{courseName}`, `{productName}`, and `{itemName}` in the template. */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  itemTitle: string,
  template?: string | null,
): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  const base =
    template?.trim() || 'Hi, I want to enroll in {courseName}. Please guide me through payment.'
  const text = base
    .replace(/\{courseName\}/g, itemTitle)
    .replace(/\{productName\}/g, itemTitle)
    .replace(/\{itemName\}/g, itemTitle)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

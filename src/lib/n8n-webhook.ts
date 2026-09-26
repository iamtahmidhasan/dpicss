const WEBHOOK_TIMEOUT_MS = 10_000

const N8N_MEMBER_WEBHOOK_URL =
  process.env.N8N_MEMBER_REGISTRATION_WEBHOOK?.trim() || ''

export type MemberWebhookPayload = {
  event: 'created' | 'updated'
  memberId: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string
  whatsappNumber: string
  group: string
  season: string
  boardRoll: string
  bloodGroup: string
  memberType: string
  bio: string
  committeeRoles: Array<{ committee: string; role?: string }>
  level: number
  isActive: boolean
  directoryApprovalStatus: string
  hasPaidRegistration: boolean
  paymentMethod: string
  paymentTransactionId: string
  senderNumber: string
  paymentNotes: string
  avatar: string | null
  nidOrBirthCertificate: string | null
  studentIdCard: string | null
  passportSizeImage: string | null
  skills: Array<{ skill: string; level: string }>
  socialLinks: {
    facebook: string
    whatsapp: string
    linkedin: string
    github: string
    website: string
  }
  enrolledCourses: string[]
  completedCourses: string[]
  certificates: Array<{
    course: string
    issuedDate: string
    certificateUrl: string
  }>
  manualCertificates: Array<{
    certificateId: string
    course: string
    certificateImageUrl: string
  }>
  complaints: Array<{
    message: string
    status: string
    createdAt: string
  }>
  createdAt: string
  updatedAt: string
}

function extractMediaId(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    return id != null ? String(id) : null
  }
  return null
}

function extractRelationshipIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => {
    if (typeof item === 'string') return item
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as { id: unknown }).id)
    }
    return String(item)
  })
}

export function buildMemberWebhookPayload(
  doc: Record<string, unknown>,
  event: 'created' | 'updated',
): MemberWebhookPayload {
  const firstName = String(doc.firstName || '')
  const lastName = String(doc.lastName || '')

  return {
    event,
    memberId: String(doc.memberId || doc.id || ''),
    username: String(doc.username || ''),
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' '),
    email: String(doc.email || ''),
    phoneNumber: String(doc.phoneNumber || ''),
    whatsappNumber: String(doc.whatsappNumber || ''),
    group: String(doc.group || ''),
    season: String(doc.season || ''),
    boardRoll: String(doc.boardRoll || ''),
    bloodGroup: String(doc.bloodGroup || ''),
    memberType: String(doc.memberType || 'student'),
    bio: String(doc.bio || ''),
    committeeRoles: Array.isArray(doc.committeeRoles)
      ? (doc.committeeRoles as Array<Record<string, unknown>>).map((cr) => ({
          committee: extractRelationshipId(cr.committee),
          role: String(cr.role || ''),
        }))
      : [],
    level: Number(doc.level || 1),
    isActive: Boolean(doc.isActive),
    directoryApprovalStatus: String(doc.directoryApprovalStatus || 'pending'),
    hasPaidRegistration: Boolean(doc.hasPaidRegistration),
    paymentMethod: String(doc.paymentMethod || ''),
    paymentTransactionId: String(doc.paymentTransactionId || ''),
    senderNumber: String(doc.senderNumber || ''),
    paymentNotes: String(doc.paymentNotes || ''),
    avatar: extractMediaId(doc.avatar),
    nidOrBirthCertificate: extractMediaId(doc.nidOrBirthCertificate),
    studentIdCard: extractMediaId(doc.studentIdCard),
    passportSizeImage: extractMediaId(doc.passportSizeImage),
    skills: Array.isArray(doc.skills)
      ? (doc.skills as Array<Record<string, unknown>>).map((s) => ({
          skill: String(s.skill || ''),
          level: String(s.level || 'beginner'),
        }))
      : [],
    socialLinks: {
      facebook: String((doc.socialLinks as Record<string, unknown>)?.facebook || ''),
      whatsapp: String((doc.socialLinks as Record<string, unknown>)?.whatsapp || ''),
      linkedin: String((doc.socialLinks as Record<string, unknown>)?.linkedin || ''),
      github: String((doc.socialLinks as Record<string, unknown>)?.github || ''),
      website: String((doc.socialLinks as Record<string, unknown>)?.website || ''),
    },
    enrolledCourses: extractRelationshipIds(doc.enrolledCourses),
    completedCourses: extractRelationshipIds(doc.completedCourses),
    certificates: Array.isArray(doc.certificates)
      ? (doc.certificates as Array<Record<string, unknown>>).map((c) => ({
          course: extractRelationshipId(c.course),
          issuedDate: String(c.issuedDate || ''),
          certificateUrl: String(c.certificateUrl || ''),
        }))
      : [],
    manualCertificates: Array.isArray(doc.manualCertificates)
      ? (doc.manualCertificates as Array<Record<string, unknown>>).map((mc) => ({
          certificateId: String(mc.certificateId || ''),
          course: extractRelationshipId(mc.course),
          certificateImageUrl: String(mc.certificateImageUrl || ''),
        }))
      : [],
    complaints: Array.isArray(doc.complaints)
      ? (doc.complaints as Array<Record<string, unknown>>).map((c) => ({
          message: String(c.message || ''),
          status: String(c.status || 'submitted'),
          createdAt: String(c.createdAt || ''),
        }))
      : [],
    createdAt: String(doc.createdAt || ''),
    updatedAt: String(doc.updatedAt || ''),
  }
}

function extractRelationshipId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: unknown }).id)
  }
  return String(value)
}

export async function sendMemberWebhook(
  payload: MemberWebhookPayload,
  logger: { info: (...args: unknown[]) => void; error: (...args: unknown[]) => void },
): Promise<void> {
  if (!N8N_MEMBER_WEBHOOK_URL) {
    logger.info('[n8n] N8N_MEMBER_REGISTRATION_WEBHOOK not set — skipping')
    return
  }

  logger.info(
    `[n8n] Sending member ${payload.event} webhook for ${payload.memberId}`,
  )

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS)

  try {
    const res = await fetch(N8N_MEMBER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '<unreadable>')
      logger.error(
        `[n8n] Webhook responded with status ${res.status}: ${body}`,
      )
      return
    }

    logger.info(
      `[n8n] Webhook delivered successfully for ${payload.memberId} (${payload.event})`,
    )
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `Webhook timed out after ${WEBHOOK_TIMEOUT_MS}ms`
          : err.message
        : String(err)
    logger.error(`[n8n] Webhook failed for ${payload.memberId}: ${message}`)
  } finally {
    clearTimeout(timeout)
  }
}

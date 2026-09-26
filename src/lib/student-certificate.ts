import type { Payload, PayloadRequest, User } from 'payload'
import { formatMemberFullName } from './member-name'

type MemberLike = { memberId?: string | null; firstName?: string | null; lastName?: string | null }
type UnofficialLike = { firstName?: string | null; lastName?: string | null; id?: string }

/**
 * Display name and member identifier for certificates (hook + admin-safe, uses overrideAccess).
 */
export async function getStudentCertificateSnapshot(
  payload: Payload,
  studentId: string,
  req: PayloadRequest,
): Promise<{ fullName: string; memberId: string; email?: string | null }> {
  const student = (await payload.findByID({
    collection: 'users',
    id: studentId,
    depth: 2,
    req,
    overrideAccess: true,
  })) as User & {
    officialMemberProfile?: string | MemberLike | null
    unofficialMemberProfile?: string | UnofficialLike | null
    memberCategory?: 'official' | 'unofficial' | null
  }

  const email = typeof student.email === 'string' ? student.email : undefined

  let fullName = formatMemberFullName(undefined, undefined)
  let memberId = ''

  if (student.memberCategory === 'official') {
    const m = student.officialMemberProfile
    if (m && typeof m === 'object') {
      fullName = formatMemberFullName(m.firstName, m.lastName) || fullName
      memberId = typeof m.memberId === 'string' ? m.memberId : ''
    }
  } else {
    const u = student.unofficialMemberProfile
    if (u && typeof u === 'object') {
      fullName = formatMemberFullName(u.firstName, u.lastName) || fullName
      memberId = u.id ? `UNO-${String(u.id).slice(-8).toUpperCase()}` : ''
    }
  }

  if (!fullName) {
    fullName = email?.split('@')[0] || 'Student'
  }
  if (!memberId) {
    memberId = `UNO-${String(studentId)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10)
      .toUpperCase()}`
  }

  return { fullName, memberId, email }
}

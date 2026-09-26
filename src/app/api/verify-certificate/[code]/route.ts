import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

type ManualCertificate = {
  certificateId?: string
  course?: { title?: string } | string
  certificateImageUrl?: string
}

type MemberRecord = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  memberId?: string
  memberType?: string
  manualCertificates?: ManualCertificate[]
}

function fullName(member: MemberRecord): string {
  return [member.firstName, member.lastName].filter(Boolean).join(' ').trim()
}

function courseTitle(course: ManualCertificate['course']): string | undefined {
  if (!course) return undefined
  if (typeof course === 'string') return undefined
  return course.title || undefined
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: codeParam } = await params
  const code = String(codeParam || '').trim()
  if (!code) {
    return NextResponse.json({ valid: false, error: 'Certificate ID is required' }, { status: 400 })
  }

  const payload = await getPayload({ config: await config })

  const official = await (payload as any).find({
    collection: 'members',
    where: { 'manualCertificates.certificateId': { equals: code } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  })

  const officialMember = official?.docs?.[0] as MemberRecord | undefined
  if (officialMember) {
    const cert = officialMember.manualCertificates?.find((c) => c.certificateId === code)
    return NextResponse.json({
      valid: true,
      certificateId: cert?.certificateId || code,
      recipientName: fullName(officialMember),
      memberId: officialMember.memberId,
      memberType: 'official',
      email: officialMember.email,
      courseTitle: courseTitle(cert?.course),
      certificateImageUrl: cert?.certificateImageUrl,
    })
  }

  const unofficial = await (payload as any).find({
    collection: 'unofficial-members',
    where: { 'manualCertificates.certificateId': { equals: code } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  })

  const unofficialMember = unofficial?.docs?.[0] as MemberRecord | undefined
  if (unofficialMember) {
    const cert = unofficialMember.manualCertificates?.find((c) => c.certificateId === code)
    return NextResponse.json({
      valid: true,
      certificateId: cert?.certificateId || code,
      recipientName: fullName(unofficialMember),
      memberId: undefined,
      memberType: 'unofficial',
      email: unofficialMember.email,
      courseTitle: courseTitle(cert?.course),
      certificateImageUrl: cert?.certificateImageUrl,
    })
  }

  return NextResponse.json({ valid: false, error: 'Certificate not found' }, { status: 404 })
}
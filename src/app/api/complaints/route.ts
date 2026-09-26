import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { enforceCsrf, getOrCreateCsrfToken } from '@/lib/csrf'

type ComplaintBody = {
  message?: string
  memberId?: string
  memberType?: 'official' | 'unofficial'
}

export async function POST(request: NextRequest) {
  const csrfCheck = enforceCsrf(request)
  if (!csrfCheck.ok) {
    return csrfCheck.response || NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  try {
    const payload = await getPayload({ config: await config })
    const { user } = await payload.auth({ headers: request.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 })
    }

    const body = (await request.json()) as ComplaintBody
    const message = String(body.message || '').trim()
    const memberId = String(body.memberId || '').trim()
    const memberType = body.memberType === 'unofficial' ? 'unofficial' : 'official'

    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Complaint must be at least 10 characters' },
        { status: 400 },
      )
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: 'Complaint must be under 2000 characters' },
        { status: 400 },
      )
    }

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const collection = memberType === 'official' ? 'members' : 'unofficial-members'

    // Look up the profile by memberId
    const queryResult = await payload.find({
      collection,
      where: { memberId: { equals: memberId } },
      depth: 0,
      limit: 1,
      user,
      overrideAccess: false,
    })

    const profile = queryResult.docs?.[0]
    if (!profile) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const profileId = (profile as any).id

    const existingComplaints = Array.isArray((profile as any).complaints)
      ? (profile as any).complaints
      : []

    const createdAt = new Date().toISOString()
    const nextComplaints = [...existingComplaints, { message, createdAt }]

    const updated = await payload.update({
      collection,
      id: profileId,
      data: {
        complaints: nextComplaints,
      },
      user,
      overrideAccess: false,
    })

    const updatedComplaints = Array.isArray((updated as any).complaints)
      ? (updated as any).complaints
      : []
    const complaint = updatedComplaints[updatedComplaints.length - 1] || { message, createdAt }

    const response = NextResponse.json({ complaint })
    getOrCreateCsrfToken(response)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit complaint'
    const response = NextResponse.json({ error: message }, { status: 500 })
    getOrCreateCsrfToken(response)
    return response
  }
}

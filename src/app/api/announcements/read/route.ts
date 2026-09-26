import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { enforceCsrf, getOrCreateCsrfToken } from '@/lib/csrf'

type RequestBody = {
  announcementId?: string
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

    const body = (await request.json()) as RequestBody
    const announcementId = body.announcementId?.trim()

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    // Ensure user can access the announcement
    await (payload as any).findByID({
      collection: 'announcements',
      id: announcementId,
      user,
      overrideAccess: false,
    })

    const existing = await (payload as any).find({
      collection: 'announcement-reads',
      where: {
        and: [{ announcement: { equals: announcementId } }, { user: { equals: user.id } }],
      },
      limit: 1,
      depth: 0,
      user,
      overrideAccess: false,
    })

    if (existing.docs[0]) {
      const existingRead = existing.docs[0] as { readAt?: string }
      const response = NextResponse.json({ success: true, readAt: existingRead.readAt })
      const token = getOrCreateCsrfToken(response)
      response.headers.set('x-csrf-token', token)
      return response
    }

    const created = await (payload as any).create({
      collection: 'announcement-reads',
      data: {
        announcement: announcementId,
        user: user.id,
        readAt: new Date().toISOString(),
      },
      user,
      overrideAccess: false,
    })

    const response = NextResponse.json({
      success: true,
      readAt: (created as { readAt?: string }).readAt,
    })
    const token = getOrCreateCsrfToken(response)
    response.headers.set('x-csrf-token', token)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark announcement as read'
    const response = NextResponse.json({ error: message }, { status: 500 })
    const token = getOrCreateCsrfToken(response)
    response.headers.set('x-csrf-token', token)
    return response
  }
}

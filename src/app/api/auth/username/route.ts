import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { enforceCsrf, getOrCreateCsrfToken } from '@/lib/csrf'
import { validateUsername } from '@/lib/validation'

export async function PATCH(request: NextRequest) {
  const csrfCheck = enforceCsrf(request)
  if (!csrfCheck.ok) {
    return csrfCheck.response || NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const { user: authUser } = await payload.auth({ headers: request.headers })

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const username = validateUsername(body.username)

    // Find the member profile for this user
    const memberResult = await payload.find({
      collection: 'members',
      where: { user: { equals: authUser.id } },
      depth: 0,
      limit: 1,
      user: authUser,
      overrideAccess: false,
    })

    const member = memberResult.docs[0]
    if (!member) {
      return NextResponse.json({ error: 'Member profile not found' }, { status: 404 })
    }

    // Check if username is already taken by another member
    const existing = await payload.find({
      collection: 'members',
      where: { username: { equals: username } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0 && String(existing.docs[0].id) !== String(member.id)) {
      const response = NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      getOrCreateCsrfToken(response)
      return response
    }

    await payload.update({
      collection: 'members',
      id: String(member.id),
      data: { username },
      user: authUser,
      overrideAccess: false,
    })

    const response = NextResponse.json({ username })
    getOrCreateCsrfToken(response)
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update username'
    const response = NextResponse.json({ error: message }, { status: 400 })
    getOrCreateCsrfToken(response)
    return response
  }
}

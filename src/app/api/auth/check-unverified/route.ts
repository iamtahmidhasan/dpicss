import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ verified: true })
    }

    const user = users.docs[0]
    const isVerified = user.isVerified === true

    return NextResponse.json({
      verified: isVerified,
      needsVerification: !isVerified,
    })
  } catch (error) {
    console.error('[Check Unverified] Error:', error)
    return NextResponse.json({ error: 'Failed to check user status' }, { status: 500 })
  }
}
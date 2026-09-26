import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { enforceCsrf, getOrCreateCsrfToken } from '@/lib/csrf'

type RequestBody = {
  hasPaidRegistration: boolean
  paymentMethod?: string | null
  paymentTransactionId?: string | null
  senderNumber?: string | null
  paymentNotes?: string | null
  group: string
  whatsappNumber: string
  phoneNumber: string
  boardRoll: string
  season: string
  bloodGroup: string
  nidOrBirthCertificate?: string | null
  studentIdCard?: string | null
  passportSizeImage?: string | null
}

export async function POST(request: NextRequest) {
  const response = new NextResponse()

  // Verify CSRF token
  const csrfCheck = enforceCsrf(request)
  if (!csrfCheck.ok) {
    return csrfCheck.response || NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
  }

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Get authenticated user
    const { user: authUser } = await payload.auth({ headers: request.headers })

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: RequestBody = await request.json()

    // Validate required fields
    if (!body.group?.trim()) {
      return NextResponse.json({ error: 'Group is required' }, { status: 400 })
    }

    if (!body.whatsappNumber?.trim()) {
      return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400 })
    }

    if (!body.phoneNumber?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!body.boardRoll?.trim()) {
      return NextResponse.json({ error: 'Board roll is required' }, { status: 400 })
    }

    if (!body.season?.trim()) {
      return NextResponse.json({ error: 'Season is required' }, { status: 400 })
    }

    if (!body.bloodGroup) {
      return NextResponse.json({ error: 'Blood group is required' }, { status: 400 })
    }

    if (!body.nidOrBirthCertificate) {
      return NextResponse.json({ error: 'NID or Birth Certificate is required' }, { status: 400 })
    }

    if (!body.passportSizeImage) {
      return NextResponse.json({ error: 'Passport size image is required' }, { status: 400 })
    }

    // Find the member profile associated with this user
    const memberResult = await payload.find({
      collection: 'members',
      where: { user: { equals: authUser.id } },
      limit: 1,
      user: authUser,
      overrideAccess: false,
    })

    const member = memberResult.docs[0]

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found. Please contact support.' },
        { status: 404 },
      )
    }

    // Update member with registration details
    const updateData: Record<string, unknown> = {
      hasPaidRegistration: body.hasPaidRegistration,
      paymentMethod: body.hasPaidRegistration ? body.paymentMethod : null,
      paymentTransactionId:
        body.hasPaidRegistration && body.paymentMethod !== 'hand_to_hand'
          ? body.paymentTransactionId
          : null,
      senderNumber:
        body.hasPaidRegistration && body.paymentMethod !== 'hand_to_hand'
          ? body.senderNumber
          : null,
      paymentNotes: body.hasPaidRegistration ? body.paymentNotes : null,
      group: body.group.trim(),
      whatsappNumber: body.whatsappNumber.trim(),
      phoneNumber: body.phoneNumber.trim(),
      boardRoll: body.boardRoll.trim(),
      season: body.season.trim(),
      bloodGroup: body.bloodGroup,
      nidOrBirthCertificate: body.nidOrBirthCertificate,
      studentIdCard: body.studentIdCard,
      passportSizeImage: body.passportSizeImage,
    }

    const updatedMember = await payload.update({
      collection: 'members',
      id: String(member.id),
      data: updateData,
      user: authUser,
      overrideAccess: false,
      context: { triggerN8nWebhook: true },
    })

    const responseObject = NextResponse.json({
      success: true,
      message: 'Member profile completed successfully',
      profileUsername: String(updatedMember.username || ''),
    })

    // Set CSRF token in response
    getOrCreateCsrfToken(responseObject)

    return responseObject
  } catch (error) {
    console.error('[Official Member Details]', error)

    const message = error instanceof Error ? error.message : 'Failed to save member details'
    const responseObject = NextResponse.json({ error: message }, { status: 500 })

    // Set CSRF token even on error
    getOrCreateCsrfToken(responseObject)

    return responseObject
  }
}

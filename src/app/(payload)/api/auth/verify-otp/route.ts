import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { enforceCsrf } from '@/lib/csrf'
import { validateEmail, validateString } from '@/lib/validation'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from '@/lib/rate-limit'

const invalidOtpResponse = () =>
  NextResponse.json({ error: 'Invalid email or OTP' }, { status: 400 })

export async function POST(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  try {
    await checkRateLimit(request, rateLimitConfigs.OTP_VERIFY)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createRateLimitResponse(error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  try {
    let body: { email?: unknown; otp?: unknown }
    try {
      body = (await request.json()) as { email?: unknown; otp?: unknown }
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const normalizedEmail = validateEmail(body.email)
    const otp = validateString(body.otp, {
      fieldName: 'OTP',
      minLength: 6,
      maxLength: 6,
      pattern: /^\d{6}$/,
    })

    const payload = await getPayload({ config })

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return invalidOtpResponse()
    }

    const user = users.docs[0]

    // Check if OTP verification is already complete
    if (user.isVerified) {
      return invalidOtpResponse()
    }

    // Verify OTP
    if (!user.otp || !user.otpExpiry) {
      return invalidOtpResponse()
    }

    // Check expiry
    const expiryTime = new Date(user.otpExpiry).getTime()
    if (Date.now() > expiryTime) {
      return invalidOtpResponse()
    }

    // Hash the provided OTP to compare
    const salt = process.env.OTP_HASH_SECRET || process.env.PAYLOAD_SECRET
    if (!salt) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 503 })
    }
    const hashedOtp = crypto
      .createHash('sha256')
      .update(`${otp}:${normalizedEmail}:${salt}`)
      .digest('hex')
    const legacyHashedOtp = crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex')

    if (hashedOtp !== user.otp && legacyHashedOtp !== user.otp) {
      // Increment failed attempt counter
      const currentAttempts = (user.otpAttempts || 0) + 1
      if (currentAttempts >= 5) {
        return NextResponse.json(
          { error: 'Too many failed attempts. Please request a new OTP.' },
          { status: 429 },
        )
      }

      // Save increased attempt count
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { otpAttempts: currentAttempts },
        overrideAccess: true,
      })

      return invalidOtpResponse()
    }

    // OTP is valid - mark user as verified
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        isVerified: true,
        otp: '',
        otpExpiry: null,
        otpAttempts: 0,
      },
      overrideAccess: true,
    })

    const refreshed = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 2,
      overrideAccess: true,
    })

    let profileUsername: string | null = null
    let pendingDirectoryApproval = false

    const officialRef = refreshed.officialMemberProfile
    if (officialRef && typeof officialRef === 'object' && 'username' in officialRef) {
      profileUsername = String((officialRef as { username?: string }).username || '') || null
      const status = (officialRef as { directoryApprovalStatus?: string }).directoryApprovalStatus
      pendingDirectoryApproval = status === 'pending'
    }

    return NextResponse.json(
      {
        message: 'Email verified successfully',
        profileUsername,
        pendingDirectoryApproval,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
          isVerified: true,
          memberCategory: refreshed.memberCategory,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('required') ||
        error.message.includes('invalid') ||
        error.message.includes('must')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    return invalidOtpResponse()
  }
}

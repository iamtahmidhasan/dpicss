import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { sendPasswordResetEmail as sendPasswordResetEmailSmtp } from '@/lib/mail'
import { enforceCsrf } from '@/lib/csrf'
import { validateEmail } from '@/lib/validation'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from '@/lib/rate-limit'

const GENERIC_MESSAGE = 'If an account with that email exists, a password reset link has been sent.'

function hashResetToken(token: string): string {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) {
    throw new Error('Missing required environment variable: PAYLOAD_SECRET')
  }
  return crypto.createHash('sha256').update(`${token}:${secret}`).digest('hex')
}

async function trySendPasswordResetEmail(email: string, token: string): Promise<void> {
  try {
    await sendPasswordResetEmailSmtp(email, token)
    // Email sent successfully - no console output in production
  } catch (emailError) {
    // Log only if SMTP configuration error and in development
    const msg = emailError instanceof Error ? emailError.message : String(emailError)
    if (!/SMTP is not configured/i.test(msg) && process.env.NODE_ENV === 'development') {
      console.error('[Password Reset] Failed to send email:', emailError)
    }
    // For SMTP configuration errors, silently fail (user will get generic error)
  }
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  try {
    await checkRateLimit(request, rateLimitConfigs.PASSWORD_RESET)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createRateLimitResponse(error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  try {
    let body: { email?: unknown }
    try {
      body = (await request.json()) as { email?: unknown }
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const normalizedEmail = validateEmail(body.email)
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
      return NextResponse.json({ message: GENERIC_MESSAGE })
    }

    const user = users.docs[0] as { id: string; authProvider?: string }

    if (user.authProvider === 'google') {
      return NextResponse.json({
        message: 'This account uses Google authentication. Password reset is not available.',
      })
    }

    // Generate high-entropy token and store only hash in DB.
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = hashResetToken(resetToken)

    // Store reset token with expiry (1 hour from now)
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000)

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: expiryTime.toISOString(),
      },
      overrideAccess: true,
    })

    await trySendPasswordResetEmail(normalizedEmail, resetToken)

    return NextResponse.json({
      message: GENERIC_MESSAGE,
    })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

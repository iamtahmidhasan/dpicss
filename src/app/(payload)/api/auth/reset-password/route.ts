import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { User } from '@/payload-types'
import { enforceCsrf } from '@/lib/csrf'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from '@/lib/rate-limit'
import { validatePassword, validateString } from '@/lib/validation'

function hashResetToken(token: string): string {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret) {
    throw new Error('Missing required environment variable: PAYLOAD_SECRET')
  }
  return crypto.createHash('sha256').update(`${token}:${secret}`).digest('hex')
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
    let body: { token?: unknown; password?: unknown; passwordConfirm?: unknown }
    try {
      body = (await request.json()) as {
        token?: unknown
        password?: unknown
        passwordConfirm?: unknown
      }
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const token = validateString(body.token, { fieldName: 'Token', minLength: 16, maxLength: 512 })
    const password = validatePassword(body.password, {
      minLength: 8,
      requireNumbers: true,
    })
    const passwordConfirm = validateString(body.passwordConfirm, {
      fieldName: 'Password confirmation',
      minLength: 8,
      maxLength: 512,
    })

    const tokenHash = hashResetToken(token)

    if (password !== passwordConfirm) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config })

    type ResetMode = 'app-forgot' | 'payload-endpoint'

    let user: User | undefined
    let mode: ResetMode | null = null

    const appForgot = await payload.find({
      collection: 'users',
      where: {
        or: [
          { passwordResetToken: { equals: tokenHash } },
          { passwordResetToken: { equals: token } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (appForgot.docs[0]) {
      user = appForgot.docs[0]
      mode = 'app-forgot'
    }

    if (!user || !mode) {
      const found = await payload.find({
        collection: 'users',
        where: {
          or: [
            { resetPasswordToken: { equals: token } },
            { resetPasswordToken: { equals: tokenHash } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (
        found.docs[0] &&
        (found.docs[0].resetPasswordToken === token ||
          found.docs[0].resetPasswordToken === tokenHash)
      ) {
        user = found.docs[0]
        mode = 'payload-endpoint'
      }
    }

    if (!user || !mode) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    const expiryRaw =
      mode === 'app-forgot' ? user.passwordResetExpiry : user.resetPasswordExpiration
    if (!expiryRaw) {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 })
    }

    const expiryTime = new Date(expiryRaw).getTime()
    if (Number.isNaN(expiryTime) || Date.now() > expiryTime) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password,
        ...(mode === 'app-forgot'
          ? {
              passwordResetToken: null,
              passwordResetExpiry: null,
            }
          : {
              resetPasswordToken: null,
              resetPasswordExpiration: null,
            }),
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      message: 'Password reset successfully',
      success: true,
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

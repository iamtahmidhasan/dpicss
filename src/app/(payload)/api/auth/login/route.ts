import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { PAYLOAD_TOKEN_COOKIE, shouldUseSecureCookies } from '@/lib/auth-cookie'
import { enforceCsrf } from '@/lib/csrf'
import { validateEmail, validateString } from '@/lib/validation'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from '@/lib/rate-limit'

const invalidLoginResponse = () =>
  NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

export async function POST(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  try {
    await checkRateLimit(request, rateLimitConfigs.AUTH)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createRateLimitResponse(error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  try {
    let body: { email?: unknown; password?: unknown }
    try {
      body = (await request.json()) as { email?: unknown; password?: unknown }
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const normalizedEmail = validateEmail(body.email)
    const password = validateString(body.password, {
      fieldName: 'Password',
      minLength: 1,
      maxLength: 256,
    })

    const payload = await getPayload({ config })

    const users = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (users.docs.length === 0) {
      return NextResponse.json({ error: 'No account found with this email. Please register first.' }, { status: 401 })
    }

    const user = users.docs[0]
    const roles = user.roles as string[] | undefined
    const isAdmin = Array.isArray(roles) && roles.includes('admin')

    if (isAdmin && !user.isVerified) {
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
    }

    if (!isAdmin && !user.isVerified) {
      const otpExpiry = user.otpExpiry as string | null | undefined
      if (otpExpiry && new Date(otpExpiry).getTime() < Date.now()) {
        const memberCategory = user.memberCategory as string | undefined
        const officialProfileId = typeof user.officialMemberProfile === 'object'
          ? (user.officialMemberProfile as { id?: string })?.id
          : user.officialMemberProfile as string | undefined
        const unofficialProfileId = typeof user.unofficialMemberProfile === 'object'
          ? (user.unofficialMemberProfile as { id?: string })?.id
          : user.unofficialMemberProfile as string | undefined

        if (memberCategory === 'official' && officialProfileId) {
          try {
            await payload.delete({ collection: 'members', id: String(officialProfileId), overrideAccess: true })
          } catch { /* ignore */ }
        } else if (memberCategory === 'unofficial' && unofficialProfileId) {
          try {
            await payload.delete({ collection: 'unofficial-members', id: String(unofficialProfileId), overrideAccess: true })
          } catch { /* ignore */ }
        }

        await payload.delete({ collection: 'users', id: String(user.id), overrideAccess: true })
        return NextResponse.json({ error: 'Account expired. Please register again.' }, { status: 401 })
      }
      return NextResponse.json({ error: 'Please verify your email first. Check your inbox for OTP.' }, { status: 401 })
    }

    let result: Awaited<ReturnType<typeof payload.login>>
    try {
      result = await payload.login({
        collection: 'users',
        data: {
          email: normalizedEmail,
          password,
        },
      })
    } catch {
      return invalidLoginResponse()
    }

    if (result.token) {
      // Create response with token
      const response = NextResponse.json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      })

      // Set HTTP-only cookie for the token
      response.cookies.set(PAYLOAD_TOKEN_COOKIE, result.token, {
        path: '/',
        httpOnly: true,
        secure: shouldUseSecureCookies(),
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })

      return response
    }
    return invalidLoginResponse()
  } catch (error: unknown) {
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

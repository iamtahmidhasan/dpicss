import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import {
  PAYLOAD_TOKEN_COOKIE,
  shouldUseSecureCookies,
} from '@/lib/auth-cookie'
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  getGoogleUserInfo,
  verifySignedState,
} from '@/lib/google-auth'
import { CSRF_COOKIE_NAME } from '@/lib/csrf'

function parseCookieValue(cookieHeader: string | null, key: string): string {
  if (!cookieHeader) return ''
  const entries = cookieHeader.split(';')
  for (const entry of entries) {
    const [k, ...rest] = entry.trim().split('=')
    if (k === key) return decodeURIComponent(rest.join('='))
  }
  return ''
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 10
const ipRateLimits = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRateLimits.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
    maxAge?: number
    path?: string
  }
) {
  response.cookies.set(name, value, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    ...options,
  })
}

function redirectWithError(
  response: NextResponse,
  path: string,
  errorParam: string
): NextResponse {
  const url = new URL(path, response.headers.get('referer') || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost')
  url.searchParams.set('error', errorParam)
  return NextResponse.redirect(url)
}

async function createOrLinkProfile(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: string,
  memberIntent: string,
  email: string,
  firstName: string,
  lastName: string,
  institutionName?: string,
  department?: string
): Promise<void> {
  if (memberIntent === 'official') {
    const { docs } = await payload.find({
      collection: 'members',
      where: { email: { equals: email } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (docs.length === 0) {
      const profile = await payload.create({
        collection: 'members',
        data: {
          user: userId,
          firstName,
          lastName,
          email,
          memberType: 'student',
          directoryApprovalStatus: 'pending',
        } as any,
        overrideAccess: true,
        draft: false,
      })
      await payload.update({
        collection: 'users',
        id: userId,
        data: { officialMemberProfile: profile.id },
        overrideAccess: true,
        draft: false,
      })
    } else {
      await payload.update({
        collection: 'users',
        id: userId,
        data: { officialMemberProfile: docs[0].id },
        overrideAccess: true,
        draft: false,
      })
    }
  } else {
    const { docs } = await payload.find({
      collection: 'unofficial-members',
      where: { email: { equals: email } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    })

    if (docs.length === 0) {
      const profile = await payload.create({
        collection: 'unofficial-members',
        data: {
          user: userId,
          firstName,
          lastName,
          email,
          institutionName: institutionName || '',
          department: department || '',
          status: 'pending',
        } as any,
        overrideAccess: true,
        draft: false,
      })
      await payload.update({
        collection: 'users',
        id: userId,
        data: { unofficialMemberProfile: profile.id },
        overrideAccess: true,
        draft: false,
      })
    } else {
      await payload.update({
        collection: 'users',
        id: userId,
        data: { unofficialMemberProfile: docs[0].id },
        overrideAccess: true,
        draft: false,
      })
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || request.url

  if (error) {
    return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/register?error=invalid_callback', baseUrl))
  }

  const oauthState = verifySignedState(state)
  if (!oauthState) {
    return NextResponse.redirect(new URL('/register?error=invalid_state', baseUrl))
  }

  const { memberIntent, flowType, institutionName, department } = oauthState

  const tokens = await exchangeCodeForTokens(code)
  if (!tokens) {
    return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl))
  }

  const googleUser = await getGoogleUserInfo(tokens.access_token)
  if (!googleUser) {
    return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl))
  }

  const payload = await getPayload({ config })
  const { email, firstName, lastName, picture, id: googleId } = googleUser

  const existingUsers = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  let userId: string
  let googlePassword: string
  let needsOfficialDetails = false
  let redirectUrl = '/account'

  if (existingUsers.docs.length > 0) {
    const existingUser = existingUsers.docs[0] as any
    const authProvider = (existingUser.authProvider as string) || 'email'
    const isVerified = existingUser.isVerified as boolean

    if (authProvider === 'email') {
      if (flowType === 'login') {
        return NextResponse.redirect(
          new URL('/login?error=email_account', baseUrl)
        )
      }
      return NextResponse.redirect(
        new URL('/register?error=email_account', baseUrl)
      )
    }

    if (!isVerified) {
      return NextResponse.redirect(
        new URL('/register?error=pending_verification', baseUrl)
      )
    }

    googlePassword = `google_${googleId}`

    await payload.update({
      collection: 'users',
      id: String(existingUser.id),
      data: {
        password: googlePassword,
        googleId,
        googlePicture: picture,
      } as any,
      overrideAccess: true,
      draft: false,
    })

    userId = String(existingUser.id)

    if (flowType === 'register') {
      await createOrLinkProfile(payload, userId, memberIntent, email, firstName, lastName, institutionName, department)
    }
  } else {
    if (flowType === 'login') {
      return NextResponse.redirect(
        new URL('/login?error=no_account', baseUrl)
      )
    }

    googlePassword = `google_${googleId}`

    try {
      const newUser = await payload.create({
        collection: 'users',
        data: {
          email,
          password: googlePassword,
          googleId,
          authProvider: 'google',
          googlePicture: picture,
          isVerified: true,
          roles:
            memberIntent === 'official'
              ? ['member', 'official_member']
              : ['member', 'unofficial_member'],
          memberCategory: memberIntent as 'official' | 'unofficial',
        } as any,
        overrideAccess: true,
        draft: false,
      })

      userId = String(newUser.id)

      await createOrLinkProfile(payload, userId, memberIntent, email, firstName, lastName, institutionName, department)

      if (memberIntent === 'official') {
        redirectUrl = '/register?step=username&google=success'
      }
    } catch (err) {
      console.error('Failed to create user:', err)
      return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl))
    }
  }

  const loginResult = await payload.login({
    collection: 'users',
    data: {
      email,
      password: googlePassword,
    },
  })

  if (!loginResult.token) {
    return NextResponse.redirect(new URL('/login?error=google_failed', baseUrl))
  }

  const response = NextResponse.redirect(new URL(redirectUrl, baseUrl))
  setCookie(response, PAYLOAD_TOKEN_COOKIE, loginResult.token, {
    secure: shouldUseSecureCookies(),
    maxAge: 60 * 60 * 24 * 30,
  })
  return response
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { memberIntent, flowType } = body

    const cookieHeader = request.headers.get('cookie') || null
    const cookieToken = parseCookieValue(cookieHeader, 'dpirc-csrf-token')
    const headerToken = request.headers.get('x-csrf-token') || ''

    const csrfOk =
      cookieToken &&
      headerToken &&
      cookieToken.length === headerToken.length &&
      crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))

    if (!csrfOk) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    if (!flowType || (flowType !== 'login' && flowType !== 'register')) {
      return NextResponse.json({ error: 'Invalid flow type' }, { status: 400 })
    }

    if (flowType === 'register' && (!memberIntent || (memberIntent !== 'official' && memberIntent !== 'unofficial'))) {
      return NextResponse.json({ error: 'Invalid member intent' }, { status: 400 })
    }

    if (flowType === 'login') {
      const authUrl = getGoogleAuthUrl('none', 'login')
      return NextResponse.json({ url: authUrl })
    } else {
      const authUrl = getGoogleAuthUrl(
        memberIntent as 'official' | 'unofficial',
        'register',
        body.institutionName,
        body.department
      )
      return NextResponse.json({ url: authUrl })
    }
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json({ error: 'Failed to initiate Google auth' }, { status: 500 })
  }
}
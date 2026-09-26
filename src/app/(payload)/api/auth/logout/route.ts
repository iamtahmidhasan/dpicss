import { NextRequest, NextResponse } from 'next/server'
import { PAYLOAD_TOKEN_COOKIE, shouldUseSecureCookies } from '@/lib/auth-cookie'
import { enforceCsrf } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || request.url

  try {
    // Create redirect response to login page
    const response = NextResponse.redirect(new URL('/login', baseUrl))

    // Clear the auth cookie (path must match login cookie scope)
    response.cookies.set(PAYLOAD_TOKEN_COOKIE, '', {
      path: '/',
      httpOnly: true,
      secure: shouldUseSecureCookies(),
      sameSite: 'lax',
      maxAge: 0,
    })

    return response
  } catch {
    // Silently fail logout - redirect anyway
    return NextResponse.redirect(new URL('/login', baseUrl))
  }
}

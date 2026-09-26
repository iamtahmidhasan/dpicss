import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  clearPayloadTokenCookie,
  decodeJwtPayload,
  isJwtAlive,
  PAYLOAD_TOKEN_COOKIE,
} from '@/lib/auth-cookie'
import { enforceCsrf, getOrCreateCsrfToken, CSRF_COOKIE_NAME } from '@/lib/csrf'
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/locale'

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl

  if (pathname.startsWith('/api')) {
    const csrf = enforceCsrf(req)
    if (!csrf.ok) {
      return csrf.response
    }

    const apiResponse = NextResponse.next()
    const existingToken = req.cookies.get(CSRF_COOKIE_NAME)?.value
    getOrCreateCsrfToken(apiResponse, existingToken)
    return apiResponse
  }

  const rawToken = req.cookies.get(PAYLOAD_TOKEN_COOKIE)?.value
  const tokenAlive = isJwtAlive(rawToken)
  const sessionHint = req.nextUrl.searchParams.get('session')
  const selectedLang = req.nextUrl.searchParams.get('lang')
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || req.url

  if (selectedLang) {
    const url = req.nextUrl.clone()
    url.searchParams.delete('lang')

    const response = NextResponse.redirect(url)
    const normalized = normalizeLocale(selectedLang)
    response.cookies.set(LOCALE_COOKIE, normalized, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  const secure = process.env.NODE_ENV === 'production'

  // Stale cookie: server auth would fail → would bounce /account ↔ /login forever
  if (rawToken && !tokenAlive) {
    const clear = clearPayloadTokenCookie({ secure })
    if (pathname === '/account') {
      const url = new URL('/login', baseUrl)
      url.searchParams.set('session', 'expired')
      const res = NextResponse.redirect(url)
      res.cookies.set(clear.name, clear.value, {
        path: clear.path,
        maxAge: clear.maxAge,
        httpOnly: clear.httpOnly,
        sameSite: clear.sameSite,
        secure: clear.secure,
      })
      return res
    }
    if (pathname === '/login' || pathname === '/register') {
      const res = NextResponse.next()
      res.cookies.set(clear.name, clear.value, {
        path: clear.path,
        maxAge: clear.maxAge,
        httpOnly: clear.httpOnly,
        sameSite: clear.sameSite,
        secure: clear.secure,
      })
      return res
    }
  }

  if (tokenAlive && pathname.startsWith('/admin')) {
    const payload = decodeJwtPayload(rawToken!)
    const roles = Array.isArray(payload?.roles) ? (payload?.roles as string[]) : []

    const hasPrivilegedRole =
      roles.includes('admin') || roles.includes('editor') || roles.includes('instructor')
    const hasMemberFamilyRole =
      roles.includes('member') ||
      roles.includes('official_member') ||
      roles.includes('unofficial_member')

    if (hasMemberFamilyRole && !hasPrivilegedRole) {
      return NextResponse.redirect(new URL('/account', baseUrl))
    }
  }

  if (tokenAlive && (pathname === '/login' || pathname === '/register')) {
    if (sessionHint === 'expired') {
      const res = NextResponse.next()
      const clear = clearPayloadTokenCookie({ secure })
      res.cookies.set(clear.name, clear.value, {
        path: clear.path,
        maxAge: clear.maxAge,
        httpOnly: clear.httpOnly,
        sameSite: clear.sameSite,
        secure: clear.secure,
      })
      return res
    }

    // Allow access to /register for Google OAuth flow steps
    if (pathname === '/register' && (searchParams.get('step') === 'official-details' || searchParams.get('step') === 'username')) {
      return NextResponse.next()
    }

    // Allow access to /register for Google auth errors
    if (pathname === '/register' && searchParams.get('error') === 'google_auth_failed') {
      return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/account', baseUrl))
  }

  if (!tokenAlive && pathname === '/account') {
    return NextResponse.redirect(new URL('/login', baseUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

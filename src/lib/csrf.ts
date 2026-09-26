import { NextRequest, NextResponse } from 'next/server'
import { shouldUseSecureCookies } from './auth-cookie'

export const CSRF_COOKIE_NAME = 'dpirc-csrf-token'
const CSRF_HEADER = 'x-csrf-token'

function normalizeOrigin(value: string): string {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (origin || referer) {
    const source = origin || referer!
    const sourceOrigin = normalizeOrigin(source)

    // Direct match against nextUrl.origin
    if (sourceOrigin === request.nextUrl.origin) return true

    // Behind a reverse proxy, nextUrl.origin may have the wrong protocol
    // (e.g. http vs https). Compare against the configured server URL.
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL
    if (serverUrl && sourceOrigin === normalizeOrigin(serverUrl)) return true
  }

  // Non-browser clients may omit origin/referer; token validation handles those.
  return false
}

function secureTokenMatch(provided: string, expected: string): boolean {
  const encoder = new TextEncoder()
  const a = encoder.encode(provided)
  const b = encoder.encode(expected)

  if (a.length !== b.length) return false

  // Constant-time compare to reduce token oracle risk.
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i]
  }

  return diff === 0
}

function randomHex(bytes: number): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function getOrCreateCsrfToken(response?: NextResponse, currentToken?: string): string {
  const token = currentToken && /^[a-f0-9]{64}$/i.test(currentToken) ? currentToken : randomHex(32)

  if (response) {
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      path: '/',
      httpOnly: false,
      secure: shouldUseSecureCookies(),
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
    })
  }

  return token
}

export function csrfHeaderName(): string {
  return CSRF_HEADER
}

export function enforceCsrf(
  request: NextRequest,
): { ok: true } | { ok: false; response: NextResponse } {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return { ok: true }
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value || ''
  const headerToken = request.headers.get(CSRF_HEADER) || ''

  if (cookieToken && headerToken && secureTokenMatch(headerToken, cookieToken)) {
    return { ok: true }
  }

  if (isSameOrigin(request)) {
    return { ok: true }
  }

  return {
    ok: false,
    response: NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 }),
  }
}

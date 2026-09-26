/** Cookie name used by custom login route and Payload auth. */
export const PAYLOAD_TOKEN_COOKIE = 'payload-token'

export function shouldUseSecureCookies(): boolean {
  const forced = process.env.REQUIRE_SECURE_COOKIES?.trim().toLowerCase()
  if (forced === 'true') return true
  if (forced === 'false') return false
  return process.env.NODE_ENV === 'production'
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4)
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * True when the JWT is present, decodable, and not past `exp` (with skew).
 * Does not verify the signature (same limitation as Edge middleware).
 */
export function isJwtAlive(token: string | undefined | null, skewMs = 30_000): boolean {
  if (!token?.length) return false
  const payload = decodeJwtPayload(token)
  if (!payload) return false
  const exp = payload.exp
  if (typeof exp !== 'number') return true
  return exp * 1000 > Date.now() - skewMs
}

export function clearPayloadTokenCookie(init?: { secure?: boolean }): {
  name: string
  value: string
  path: string
  maxAge: number
  httpOnly: boolean
  sameSite: 'lax'
  secure: boolean
} {
  const secure = init?.secure ?? shouldUseSecureCookies()
  return {
    name: PAYLOAD_TOKEN_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure,
  }
}

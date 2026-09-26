import crypto from 'crypto'
import type { PayloadRequest } from 'payload'

export const PAYLOAD_CSRF_COOKIE = 'dpirc-csrf-token'
export const PAYLOAD_CSRF_HEADER = 'x-csrf-token'
export const CSRF_COOKIE_NAME = 'dpirc-csrf-token'
export const OTP_EXPIRY_MINUTES = 5
export const OTP_MAX_ATTEMPTS = 5
export const MIN_PASSWORD_LENGTH = 8

export const generateOTP = (): string => `${Math.floor(100000 + Math.random() * 900000)}`

export const hashOTP = (otp: string, identifier: string, secret: string): string => {
  return crypto
    .createHash('sha256')
    .update(`${otp}:${identifier.toLowerCase()}:${secret}`)
    .digest('hex')
}

export const hashOTPLegacy = (otp: string, secret: string): string =>
  crypto.createHash('sha256').update(`${otp}:${secret}`).digest('hex')

export const hashResetToken = (token: string, secret: string): string =>
  crypto.createHash('sha256').update(`${token}:${secret}`).digest('hex')

export const addMinutes = (minutes: number): Date => new Date(Date.now() + minutes * 60 * 1000)

export const getBody = async (req: PayloadRequest): Promise<Record<string, unknown> | null> => {
  try {
    const parse = req.json
    if (typeof parse !== 'function') return null
    return (await parse.call(req)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function parseCookieValue(cookieHeader: string | null, key: string): string {
  if (!cookieHeader) return ''
  const entries = cookieHeader.split(';')
  for (const entry of entries) {
    const [k, ...rest] = entry.trim().split('=')
    if (k === key) {
      return decodeURIComponent(rest.join('='))
    }
  }
  return ''
}

function safeOrigin(value: string | null | undefined): string {
  if (!value) return ''
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function payloadSameOrigin(req: PayloadRequest, serverUrl: string): boolean {
  const expected = safeOrigin(serverUrl)
  const origin = safeOrigin(req.headers?.get?.('origin'))
  const referer = safeOrigin(req.headers?.get?.('referer'))

  if (origin && expected) return origin === expected
  if (referer && expected) return referer === expected
  return false
}

function payloadSecureTokenMatch(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

export function enforcePayloadCsrf(req: PayloadRequest, serverUrl: string): Response | null {
  const method = String(req.method || 'GET').toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return null

  const cookieHeader = req.headers?.get?.('cookie') || null
  const cookieToken = parseCookieValue(cookieHeader, PAYLOAD_CSRF_COOKIE)
  const headerToken = req.headers?.get?.(PAYLOAD_CSRF_HEADER) || ''

  if (cookieToken && headerToken && payloadSecureTokenMatch(cookieToken, headerToken)) {
    return null
  }

  if (payloadSameOrigin(req, serverUrl)) {
    return null
  }

  return Response.json({ error: 'Invalid CSRF token' }, { status: 403 })
}

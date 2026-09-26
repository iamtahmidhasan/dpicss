/**
 * Rate Limiting Utility
 * Uses Redis when configured (multi-instance safe) with in-memory fallback.
 */

import { createClient } from 'redis'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (expires entries after 1 hour)
const rateLimitStore = new Map<string, RateLimitEntry>()

type RedisClient = ReturnType<typeof createClient>

let redisClient: RedisClient | null = null
let redisConnectAttempted = false

function getRedisUrl(): string | null {
  const raw = process.env.REDIS_URL?.trim()
  if (!raw) return null

  if (raw.startsWith('rediss://')) return raw
  if (raw.includes('upstash.io') || process.env.REDIS_TLS === 'true') {
    return raw.replace(/^redis:\/\//, 'rediss://')
  }

  return raw
}

async function getRedisClient(): Promise<RedisClient | null> {
  const redisUrl = getRedisUrl()
  if (!redisUrl) return null

  if (redisClient?.isOpen) return redisClient
  if (redisConnectAttempted && !redisClient?.isOpen) return null

  redisConnectAttempted = true

  try {
    const client = createClient({
      url: redisUrl,
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        connectTimeout: 1500,
        reconnectStrategy: (retries) => (retries > 1 ? false : 250),
      },
    })

    client.on('error', () => {
      // Fallback to memory on Redis errors.
    })

    await client.connect()
    redisClient = client
    return redisClient
  } catch {
    redisClient = null
    return null
  }
}

// Cleanup old entries every 10 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key)
      }
    }
  },
  10 * 60 * 1000,
)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number // In milliseconds
  keyGenerator?: (req: { headers?: Headers; ip?: string }) => string
  failClosed?: boolean
}

/**
 * Check rate limit and throw error if exceeded
 * Returns remaining requests in window
 */
function checkRateLimitInMemory(
  req: { headers?: Headers; ip?: string },
  config: RateLimitConfig,
): { remaining: number; retryAfter: number } {
  const key = config.keyGenerator ? config.keyGenerator(req) : getClientKey(req)

  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // New or expired entry
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      remaining: config.maxRequests - 1,
      retryAfter: 0,
    }
  }

  // Increment existing entry
  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000) // Seconds
    const error = new RateLimitError(
      `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    )
    throw error
  }

  return {
    remaining: config.maxRequests - entry.count,
    retryAfter: 0,
  }
}

/**
 * Check rate limit and throw error if exceeded.
 * Uses Redis when available; falls back to in-memory when unavailable.
 */
export async function checkRateLimit(
  req: { headers?: Headers; ip?: string },
  config: RateLimitConfig & { name?: string },
): Promise<{ remaining: number; retryAfter: number }> {
  const redis = await getRedisClient()
  if (!redis) {
    if (config.failClosed) {
      throw new RateLimitError('Rate limit backend unavailable. Please try again shortly.', 60)
    }
    return checkRateLimitInMemory(req, config)
  }

  const clientKey = config.keyGenerator ? config.keyGenerator(req) : getClientKey(req)
  const scope = config.name || 'default'
  const key = `ratelimit:${scope}:${clientKey}`

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.pExpire(key, config.windowMs)
    }

    if (current > config.maxRequests) {
      const ttl = await redis.pTTL(key)
      const retryAfter = Math.max(1, Math.ceil(Math.max(ttl, 0) / 1000))
      throw new RateLimitError(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      )
    }

    return {
      remaining: Math.max(0, config.maxRequests - current),
      retryAfter: 0,
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error
    }

    // Redis failure fallback.
    if (config.failClosed) {
      throw new RateLimitError('Rate limit backend unavailable. Please try again shortly.', 60)
    }
    return checkRateLimitInMemory(req, config)
  }
}

/**
 * Extract client identifier (IP address)
 */
function getClientKey(req: { headers?: Headers; ip?: string }): string {
  if (req.ip) return `client:${req.ip}`

  // Try to get IP from headers (behind reverse proxy)
  const forwarded = req.headers?.get?.('x-forwarded-for')
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim()
    return `client:${ip}`
  }

  const realIp = req.headers?.get?.('x-real-ip')
  if (realIp) return `client:${realIp}`

  return 'client:unknown'
}

/**
 * Custom error for rate limit violations
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number

  constructor(message: string, retryAfter: number) {
    super(message)
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Predefined rate limit configs for common use cases
 */
export const rateLimitConfigs = {
  // Allow strict fail-closed mode only when explicitly requested.
  // Default keeps auth available with in-memory fallback if Redis is down.
  // Set RATE_LIMIT_FAIL_CLOSED=true to enforce backend dependency.
  // Auth endpoints (strict)
  AUTH: {
    name: 'auth',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    failClosed: process.env.RATE_LIMIT_FAIL_CLOSED === 'true',
  },

  // OTP verification (very strict)
  OTP_VERIFY: {
    name: 'otp_verify',
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
    failClosed: process.env.RATE_LIMIT_FAIL_CLOSED === 'true',
  },

  // OTP resend (moderate)
  OTP_RESEND: {
    name: 'otp_resend',
    maxRequests: 2,
    windowMs: 60 * 60 * 1000, // 1 hour
    failClosed: process.env.RATE_LIMIT_FAIL_CLOSED === 'true',
  },

  // Password reset (moderate)
  PASSWORD_RESET: {
    name: 'password_reset',
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    failClosed: process.env.RATE_LIMIT_FAIL_CLOSED === 'true',
  },

  // General API (lenient)
  API: {
    name: 'api',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },

  // Course updates (moderate)
  COURSE_UPDATE: {
    name: 'course_update',
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
}

/**
 * Create a Response object for rate limit errors
 */
export function createRateLimitResponse(error: RateLimitError): Response {
  return Response.json(
    {
      error: error.message,
      retryAfter: error.retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(error.retryAfter),
        'X-RateLimit-Limit-Reset': String(Math.floor(Date.now() / 1000) + error.retryAfter),
      },
    },
  )
}

import { createClient } from 'redis'

const DEFAULT_TTL_SECONDS = 300
const DEFAULT_OPERATION_TIMEOUT_MS = 1500
const KEY_PREFIX = `${process.env.REDIS_KEY_PREFIX || 'dpirc'}:${process.env.NODE_ENV || 'development'}`

type AppRedisClient = ReturnType<typeof createClient>

let client: AppRedisClient | null = null
let isConnectAttempted = false
let isUnavailable = false
let isRedisErrorLogged = false
let lastCacheWarnAt = 0

function logCacheWarning(message: string, error?: unknown): void {
  const now = Date.now()
  if (now - lastCacheWarnAt < 5 * 60 * 1000) return
  lastCacheWarnAt = now

  if (process.env.NODE_ENV !== 'test') {
    console.warn(`[cache] ${message}`, error)
  }
}

function redisEnabled(): boolean {
  const redisUrl = process.env.REDIS_URL?.trim()
  if (!redisUrl) return false

  // In production, avoid accidental localhost Redis configuration.
  if (process.env.NODE_ENV === 'production') {
    try {
      const parsed = new URL(redisUrl)
      const host = parsed.hostname.toLowerCase()
      const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
      if (isLocalHost) {
        return false
      }
    } catch {
      // If URL parsing fails, allow connect attempt and fail gracefully later.
    }
  }

  return true
}

function getOperationTimeoutMs(): number {
  const value = Number(process.env.REDIS_TIMEOUT_MS || DEFAULT_OPERATION_TIMEOUT_MS)
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_OPERATION_TIMEOUT_MS
}

function getRedisUrl(): string | null {
  const rawUrl = process.env.REDIS_URL?.trim()
  if (!rawUrl) return null

  // Upstash and most managed Redis providers require TLS.
  if (rawUrl.startsWith('rediss://')) return rawUrl

  const forceTls = process.env.REDIS_TLS === 'true'
  const looksLikeUpstash = rawUrl.includes('upstash.io')

  if (forceTls || looksLikeUpstash) {
    return rawUrl.replace(/^redis:\/\//, 'rediss://')
  }

  return rawUrl
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  const timeoutMs = getOperationTimeoutMs()
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Redis operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function connectRedisClient(): Promise<AppRedisClient | null> {
  if (!redisEnabled() || isUnavailable) {
    return null
  }

  if (client?.isOpen) {
    return client
  }

  if (isConnectAttempted && !client?.isOpen) {
    return null
  }

  isConnectAttempted = true

  try {
    const redisUrl = getRedisUrl()
    if (!redisUrl) {
      return null
    }

    const instance = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: getOperationTimeoutMs(),
        reconnectStrategy: (retries) => {
          // Avoid noisy infinite retry loops in app logs.
          if (retries >= 2) return false
          return Math.min(retries * 100, 500)
        },
      },
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
    })

    instance.on('error', (error) => {
      // Keep error tracking flag but don't spam logs in production
      if (!isRedisErrorLogged && process.env.NODE_ENV === 'development') {
        console.error('Redis client error:', error)
        isRedisErrorLogged = true
      }

      const message = error instanceof Error ? error.message : String(error)
      if (message.toLowerCase().includes('socket closed unexpectedly')) {
        isUnavailable = true
      }
    })

    await withTimeout(instance.connect())
    isRedisErrorLogged = false
    client = instance
    return client
  } catch (error) {
    // Silently fail - app continues without cache
    logCacheWarning('Redis connection failed, cache disabled fallback active', error)
    isUnavailable = true
    client = null
    return null
  }
}

function namespacedKey(key: string): string {
  return `${KEY_PREFIX}:${key}`
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = await connectRedisClient()
  if (!redis) return null

  try {
    const value = await withTimeout(redis.get(namespacedKey(key)))
    if (!value) return null
    return JSON.parse(value) as T
  } catch {
    // Silently fail - return null to trigger fresh fetch
    logCacheWarning('Redis get failed; serving uncached response')
    return null
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<void> {
  const redis = await connectRedisClient()
  if (!redis) return

  try {
    const ttl = Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : DEFAULT_TTL_SECONDS
    await withTimeout(redis.set(namespacedKey(key), JSON.stringify(data), { EX: ttl }))
  } catch {
    // Silently fail - data just won't be cached
    logCacheWarning('Redis set failed; response not cached')
  }
}

export async function deleteCache(key: string): Promise<void> {
  const redis = await connectRedisClient()
  if (!redis) return

  try {
    await withTimeout(redis.del(namespacedKey(key)))
  } catch {
    // Silently fail
    logCacheWarning('Redis delete failed')
  }
}

export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  const redis = await connectRedisClient()
  if (!redis) return

  try {
    const pattern = namespacedKey(`${prefix}*`)
    const keys: string[] = []
    let cursor = '0'

    do {
      const result = await withTimeout(redis.scan(cursor, { MATCH: pattern, COUNT: 100 }))
      cursor = result.cursor
      if (result.keys.length > 0) {
        keys.push(...result.keys)
      }
    } while (cursor !== '0')

    if (keys.length > 0) {
      await withTimeout(redis.del(keys))
    }
  } catch {
    // Silently fail
    logCacheWarning('Redis prefix delete failed')
  }
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { deleteCacheByPrefix, deleteCache } from '@/lib/cache'
import { enforceCsrf } from '@/lib/csrf'

/**
 * Cache invalidation endpoint
 * Requires admin authentication
 *
 * Usage:
 * POST /api/cache/invalidate?prefix=courses
 * POST /api/cache/invalidate?key=courses:locale:en
 * POST /api/cache/invalidate/all (WARNING: clears all cache)
 */

const secureTokenMatch = (provided: string, expected: string): boolean => {
  const providedBytes = Buffer.from(provided)
  const expectedBytes = Buffer.from(expected)
  if (providedBytes.length !== expectedBytes.length) return false
  return crypto.timingSafeEqual(providedBytes, expectedBytes)
}

export async function POST(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  // Security: Only allow in development or with admin token
  if (process.env.NODE_ENV === 'production') {
    const expectedToken = process.env.CACHE_INVALIDATION_TOKEN?.trim()
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cache invalidation token is not configured' },
        { status: 503 },
      )
    }

    const authHeader = request.headers.get('Authorization')
    const hasBearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    const token = hasBearerToken ? authHeader.slice('Bearer '.length).trim() : ''

    if (!token || !secureTokenMatch(token, expectedToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix')
  const key = searchParams.get('key')
  const pathname = new URL(request.url).pathname

  try {
    // Invalidate by prefix
    if (prefix) {
      await deleteCacheByPrefix(prefix)
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for prefix: ${prefix}`,
      })
    }

    // Invalidate specific key
    if (key) {
      await deleteCache(key)
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for key: ${key}`,
      })
    }

    // Invalidate all
    if (pathname.endsWith('/all')) {
      await deleteCacheByPrefix('') // Empty prefix matches all
      return NextResponse.json({
        success: true,
        message: 'All cache invalidated',
      })
    }

    return NextResponse.json(
      {
        error: 'Missing prefix, key, or /all endpoint',
      },
      { status: 400 },
    )
  } catch (error) {
    console.error('Cache invalidation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to invalidate cache',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

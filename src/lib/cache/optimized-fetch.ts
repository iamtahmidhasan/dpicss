/**
 * Production-level optimized data fetching with caching
 * Provides consistent performance across the platform
 */

import { Payload, Where } from 'payload'
import crypto from 'crypto'
import { getCache, setCache, deleteCacheByPrefix } from './redis'
import { CACHE_CONFIG, getCacheKey, getCacheTTL, getCachePrefix, shouldCache } from './cache-config'

interface FetchOptions {
  locale?: string
  userId?: string
  sort?: string
  filter?: string
  page?: number
  useCache?: boolean
  cacheTTL?: number
}

/**
 * Fetch collection data with automatic caching
 */
export async function fetchWithCache<T>(
  payload: Payload,
  collection: string,
  where: Where,
  options?: FetchOptions & {
    depth?: number
    limit?: number
    select?: Record<string, boolean>
  },
) {
  const {
    locale,
    userId,
    sort,
    useCache = true,
    cacheTTL,
    depth = 1,
    limit = 20,
    select,
  } = options || {}

  const whereSerialized = JSON.stringify(where)
  const whereFilterKey =
    whereSerialized.length > 180
      ? `h:${crypto.createHash('sha256').update(whereSerialized).digest('hex')}`
      : whereSerialized

  // Generate cache key
  const cacheKey = getCacheKey(collection, {
    locale,
    userId,
    sort,
    filter: whereFilterKey,
    page: options?.page,
  })

  // Check cache first if enabled
  if (useCache && shouldCache(collection)) {
    const cached = await getCache<T>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Fetch from database
  const result = await payload.find({
    collection: collection as never,
    where,
    limit,
    sort: sort ? (sort.startsWith('-') ? sort : `-${sort}`) : '-createdAt',
    select: select as never,
  })

  // Cache the result
  if (useCache && shouldCache(collection)) {
    const ttl = cacheTTL || getCacheTTL(collection as keyof typeof CACHE_CONFIG)
    await setCache(cacheKey, result, ttl)
  }

  return result as T
}

/**
 * Fetch single item by ID with caching
 */
export async function fetchByIdWithCache<T>(
  payload: Payload,
  collection: string,
  id: string,
  options?: FetchOptions & { depth?: number; select?: Record<string, boolean> },
) {
  const { depth = 1, select, useCache = true, cacheTTL, locale } = options || {}

  const cacheKey = `${collection}:id:${id}${locale ? `:${locale}` : ''}`

  // Check cache
  if (useCache && shouldCache(collection)) {
    const cached = await getCache<T>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Fetch from database
  const result = await payload.findByID({
    collection: collection as never,
    id,
    depth,
    select: select as never,
  })

  // Cache result
  if (useCache && shouldCache(collection)) {
    const ttl = cacheTTL || getCacheTTL(collection as keyof typeof CACHE_CONFIG)
    await setCache(cacheKey, result, ttl)
  }

  return result as T
}

/**
 * Fetch with pagination
 */
export async function fetchPaginatedWithCache<T>(
  payload: Payload,
  collection: string,
  where: Where,
  options?: FetchOptions & {
    depth?: number
    limit?: number
    select?: Record<string, boolean>
    page?: number
  },
) {
  return fetchWithCache<T>(payload, collection, where, {
    ...options,
    page: options?.page || 1,
  })
}

/**
 * Invalidate cache for a collection
 */
export async function invalidateCollectionCache(collection: string) {
  const prefix = getCachePrefix(collection as keyof typeof CACHE_CONFIG)
  await deleteCacheByPrefix(`${prefix}:`)
}

/**
 * Parallel fetch with caching (optimized for multiple collections)
 */
export async function fetchMultipleWithCache<T extends Record<string, any>>(
  payload: Payload,
  collections: Array<{
    name: string
    where: Where
    options?: FetchOptions & {
      depth?: number
      limit?: number
      select?: Record<string, boolean>
    }
  }>,
): Promise<T> {
  const results = {} as T

  // Use Promise.all for parallel execution
  const promises = collections.map(async (col) => {
    const result = await fetchWithCache(payload, col.name, col.where, col.options)
    return { name: col.name, result }
  })

  const settled = await Promise.allSettled(promises)

  for (const item of settled) {
    if (item.status === 'fulfilled') {
      ;(results as any)[item.value.name] = item.value.result
    }
  }

  return results
}

/**
 * Batch fetch items by IDs with caching
 */
export async function fetchByIdsWithCache<T>(
  payload: Payload,
  collection: string,
  ids: string[],
  options?: FetchOptions & { depth?: number; select?: Record<string, boolean> },
) {
  const { useCache = true } = options || {}

  // Fetch each ID in parallel
  const promises = ids.map((id) =>
    fetchByIdWithCache<T>(payload, collection, id, {
      ...options,
      useCache,
    }),
  )

  return Promise.allSettled(promises)
}

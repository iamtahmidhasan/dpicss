/**
 * Production-level caching strategy for DPI platform
 * Defines TTLs and cache key patterns for optimal performance
 */

export const CACHE_CONFIG = {
  // Static/slowly changing data - longer TTL
  MEMBERS: { ttl: 3600, prefix: 'members' }, // 1 hour
  ACHIEVEMENTS: { ttl: 3600, prefix: 'achievements' }, // 1 hour
  CATEGORIES: { ttl: 7200, prefix: 'categories' }, // 2 hours

  // Moderately changing data - medium TTL
  COURSES: { ttl: 1800, prefix: 'courses' }, // 30 minutes
  POSTS: { ttl: 900, prefix: 'posts' }, // 15 minutes
  SHOP: { ttl: 600, prefix: 'shop' }, // 10 minutes (from env var)

  // User-specific/frequently changing - short TTL
  ENROLLMENTS: { ttl: 300, prefix: 'enrollments' }, // 5 minutes
  CERTIFICATES: { ttl: 300, prefix: 'certificates' }, // 5 minutes
  COURSE_PROGRESS: { ttl: 300, prefix: 'course_progress' }, // 5 minutes

  // Stats/aggregates - medium TTL
  STATS: { ttl: 1800, prefix: 'stats' }, // 30 minutes
  SEARCH_RESULTS: { ttl: 600, prefix: 'search' }, // 10 minutes
}

/**
 * Generate a cache key with version and locale
 */
export function getCacheKey(
  collection: string,
  options?: {
    userId?: string
    locale?: string
    sort?: string
    filter?: string
    page?: number
  },
): string {
  const parts = [collection]

  if (options?.locale) parts.push(`locale:${options.locale}`)
  if (options?.sort) parts.push(`sort:${options.sort}`)
  if (options?.filter) parts.push(`filter:${options.filter}`)
  if (options?.page) parts.push(`page:${options.page}`)
  if (options?.userId) parts.push(`user:${options.userId}`)

  return parts.join(':')
}

/**
 * Get cache TTL for a collection
 */
export function getCacheTTL(collection: keyof typeof CACHE_CONFIG): number {
  return CACHE_CONFIG[collection]?.ttl || 600 // Default 10 minutes
}

/**
 * Get cache prefix for a collection
 */
export function getCachePrefix(collection: keyof typeof CACHE_CONFIG): string {
  return CACHE_CONFIG[collection]?.prefix || collection
}

/**
 * Check if a collection should be cached
 */
export function shouldCache(collection: string): boolean {
  return collection in CACHE_CONFIG
}

/**
 * Invalidate cache for a collection when data changes
 */
export function getCacheInvalidationKey(collection: string): string {
  return getCachePrefix(collection as keyof typeof CACHE_CONFIG)
}

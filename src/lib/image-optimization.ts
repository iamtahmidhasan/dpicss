import { ImageResponse } from 'next/og'

/**
 * Utility functions for image optimization
 * Implements lazy loading, responsive images, and CDN optimization
 */

/**
 * Get optimized image URL with CDN parameters
 * Supports ImageKit CDN transformations
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options?: {
    width?: number
    height?: number
    quality?: 'low' | 'medium' | 'high'
    format?: 'auto' | 'webp' | 'jpg'
  },
): string {
  if (!imageUrl) return ''

  // Already optimized URLs
  if (imageUrl.includes('imagekit.io') || imageUrl.includes('cdn.')) {
    return imageUrl
  }

  // For local/unoptimized images, construct optimization params
  const params = new URLSearchParams()

  if (options?.width) params.append('w', String(options.width))
  if (options?.height) params.append('h', String(options.height))

  const quality = options?.quality === 'low' ? 70 : options?.quality === 'high' ? 90 : 80
  params.append('q', String(quality))

  const format = options?.format || 'auto'
  params.append('f', format)

  // Add cache busting and lazy loading params
  params.append('auto', 'format')

  const separator = imageUrl.includes('?') ? '&' : '?'
  return `${imageUrl}${separator}${params.toString()}`
}

/**
 * Generate srcSet for responsive images
 */
export function generateImageSrcSet(baseUrl: string, sizes: number[] = [320, 640, 960, 1280]) {
  if (!baseUrl) return ''

  return sizes
    .map((size) => `${getOptimizedImageUrl(baseUrl, { width: size })} ${size}w`)
    .join(', ')
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateImageSizes(
  breakpoints = {
    small: '(max-width: 640px) 100vw',
    medium: '(max-width: 1024px) 80vw',
    large: '50vw',
  },
): string {
  return `${breakpoints.small}, ${breakpoints.medium}, ${breakpoints.large}`
}

/**
 * Lazy load image with blur placeholder
 */
export interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  blurDataUrl?: string
}

/**
 * Get blur placeholder for images
 * Returns a low-quality image data URL
 */
export function getBlurPlaceholder(imageUrl: string): string {
  if (!imageUrl) return ''

  // Generate a very low quality version as placeholder
  return getOptimizedImageUrl(imageUrl, {
    width: 10,
    height: 10,
    quality: 'low',
  })
}

/**
 * Image optimization recommendations
 */
export const IMAGE_OPTIMIZATION_TIPS = {
  // Max sizes for different contexts
  THUMBNAIL: { width: 300, height: 200 },
  CARD: { width: 400, height: 300 },
  HERO: { width: 1200, height: 400 },
  FULL_WIDTH: { width: 1600, height: 900 },

  // Recommended quality levels
  QUALITY: {
    LOW: 60, // Thumbnails, placeholders
    MEDIUM: 80, // Standard display
    HIGH: 90, // Hero images, important content
  },

  // Recommended formats
  FORMATS: {
    MODERN: 'webp', // Chrome, Firefox, Edge
    FALLBACK: 'jpg', // Safari, older browsers
  },
}

/**
 * Component wrapper for optimized image
 * Use in Next.js 13+ with 'use client'
 */
export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  priority = false,
  className = '',
}: LazyImageProps) {
  // This would be used in a client component like:
  // import Image from 'next/image'
  // return (
  //   <Image
  //     src={getOptimizedImageUrl(src, { width, height })}
  //     alt={alt}
  //     width={width}
  //     height={height}
  //     priority={priority}
  //     className={className}
  //     placeholder="blur"
  //     blurDataURL={getBlurPlaceholder(src)}
  //   />
  // )
  return null
}

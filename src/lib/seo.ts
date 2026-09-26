import type { Metadata } from 'next'
import type { Viewport } from 'next'

const DEFAULT_SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Computing Society'
const DEFAULT_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  'DPI Computing Society courses, achievements, members, and robotics resources.'
const DEFAULT_OG_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '/og-default.jpg'
const TWITTER_SITE = process.env.NEXT_PUBLIC_TWITTER_SITE || undefined
const TWITTER_CREATOR = process.env.NEXT_PUBLIC_TWITTER_CREATOR || undefined
const THEME_COLOR_LIGHT = process.env.NEXT_PUBLIC_THEME_COLOR_LIGHT || '#ffffff'
const THEME_COLOR_DARK = process.env.NEXT_PUBLIC_THEME_COLOR_DARK || '#0b1220'

function normalizeCanonicalHost(url: URL): URL {
  const next = new URL(url.toString())
  const explicitHost = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim()
  const preferWWW = process.env.NEXT_PUBLIC_CANONICAL_WWW === 'true'
  const isLocal =
    next.hostname === 'localhost' ||
    next.hostname === '127.0.0.1' ||
    next.hostname === '::1' ||
    next.hostname.endsWith('.local')

  if (explicitHost) {
    next.hostname = explicitHost
    return next
  }

  if (isLocal) {
    return next
  }

  if (preferWWW) {
    if (!next.hostname.startsWith('www.')) {
      next.hostname = `www.${next.hostname}`
    }
  } else if (next.hostname.startsWith('www.')) {
    next.hostname = next.hostname.replace(/^www\./, '')
  }

  return next
}

function baseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dpirc.com'
  try {
    return normalizeCanonicalHost(new URL(raw))
  } catch {
    return new URL('https://dpirc.com')
  }
}

export function toAbsoluteUrl(pathOrUrl?: string): string {
  const root = baseUrl()
  if (!pathOrUrl) return root.toString()

  try {
    return normalizeCanonicalHost(new URL(pathOrUrl)).toString()
  } catch {
    const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
    return normalizeCanonicalHost(new URL(normalized, root)).toString()
  }
}

function toLanguageAlternate(pathOrUrl: string | undefined, lang: 'en' | 'bn'): string {
  const absolute = toAbsoluteUrl(pathOrUrl || '/')
  const url = new URL(absolute)
  url.searchParams.set('lang', lang)
  return url.toString()
}

type PageMetadataInput = {
  title?: string
  description?: string
  path?: string
  image?: string
  keywords?: string[]
  noIndex?: boolean
  openGraphType?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  twitterCreator?: string
}

export function createPageMetadata(input: PageMetadataInput): Metadata {
  const siteName = DEFAULT_SITE_NAME
  const description = input.description || DEFAULT_DESCRIPTION
  const canonical = toAbsoluteUrl(input.path)
  const image = toAbsoluteUrl(input.image || DEFAULT_OG_IMAGE)
  const title = input.title ? `${input.title} | ${siteName}` : siteName
  const openGraphType = input.openGraphType || 'website'
  const isIndexable = !input.noIndex

  const languageAlternates = isIndexable
    ? {
        en: toLanguageAlternate(input.path, 'en'),
        bn: toLanguageAlternate(input.path, 'bn'),
        'x-default': canonical,
      }
    : undefined

  return {
    metadataBase: baseUrl(),
    title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      type: openGraphType,
      title,
      description,
      siteName,
      url: canonical,
      images: [{ url: image }],
      ...(openGraphType === 'article'
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime,
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: TWITTER_SITE,
      creator: input.twitterCreator || TWITTER_CREATOR,
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            'max-snippet': -1,
            'max-image-preview': 'none',
            'max-video-preview': -1,
          },
        }
      : {
          index: true,
          follow: true,
        },
  }
}

export function createViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: THEME_COLOR_LIGHT },
      { media: '(prefers-color-scheme: dark)', color: THEME_COLOR_DARK },
      { color: THEME_COLOR_DARK },
    ],
  }
}

export function createPWAMetadata(): Partial<Metadata> {
  return {
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'DPI RC',
    },
  }
}

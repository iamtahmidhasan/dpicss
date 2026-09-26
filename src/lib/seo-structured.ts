import { toAbsoluteUrl } from '@/lib/seo'

type BaseStructuredInput = {
  urlPath: string
  image?: string
}

export function organizationJsonLd() {
  const name = process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Robotics Club'
  const logo = toAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_LOGO || '/logo.png')

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: toAbsoluteUrl('/'),
    logo,
  }
}

export function websiteJsonLd() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Robotics Club'
  const base = toAbsoluteUrl('/')

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${toAbsoluteUrl('/search')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

type BreadcrumbItem = {
  name: string
  urlPath: string
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.urlPath),
    })),
  }
}

export function articleJsonLd(
  input: BaseStructuredInput & {
    title: string
    description: string
    publishedAt?: string
    modifiedAt?: string
    authorName?: string
  },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    mainEntityOfPage: toAbsoluteUrl(input.urlPath),
    url: toAbsoluteUrl(input.urlPath),
    image: input.image ? [toAbsoluteUrl(input.image)] : undefined,
    datePublished: input.publishedAt,
    dateModified: input.modifiedAt || input.publishedAt,
    author: input.authorName
      ? {
          '@type': 'Person',
          name: input.authorName,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Robotics Club',
    },
  }
}

export function courseJsonLd(
  input: BaseStructuredInput & {
    title: string
    description: string
    instructorName?: string
    providerName?: string
  },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.title,
    description: input.description,
    url: toAbsoluteUrl(input.urlPath),
    image: input.image ? [toAbsoluteUrl(input.image)] : undefined,
    provider: {
      '@type': 'Organization',
      name: input.providerName || process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Robotics Club',
      sameAs: toAbsoluteUrl('/'),
    },
    instructor: input.instructorName
      ? {
          '@type': 'Person',
          name: input.instructorName,
        }
      : undefined,
  }
}

export function creativeWorkJsonLd(
  input: BaseStructuredInput & {
    title: string
    description?: string
    datePublished?: string
  },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: input.title,
    description: input.description,
    url: toAbsoluteUrl(input.urlPath),
    image: input.image ? [toAbsoluteUrl(input.image)] : undefined,
    datePublished: input.datePublished,
    publisher: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Robotics Club',
    },
  }
}

export function personJsonLd(
  input: BaseStructuredInput & {
    name: string
    description?: string
  },
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    description: input.description,
    image: input.image ? toAbsoluteUrl(input.image) : undefined,
    url: toAbsoluteUrl(input.urlPath),
    memberOf: {
      '@type': 'Organization',
      name: process.env.NEXT_PUBLIC_SITE_NAME || 'DPI Robotics Club',
      url: toAbsoluteUrl('/'),
    },
  }
}

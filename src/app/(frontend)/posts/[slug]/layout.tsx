import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { createPageMetadata } from '@/lib/seo'

type Props = {
  children: ReactNode
  params: Promise<{ slug: string }> | { slug: string }
}

type PostSeoDoc = {
  title?: unknown
  excerpt?: unknown
  publishedAt?: string
  updatedAt?: string
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
  } | null
  featuredImage?: { url?: string | null } | string | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await Promise.resolve(params)
  const slug = resolved.slug
  const locale = await getRequestLocale()
  const payload = await getPayloadWithRetry()
  const locOpts = payloadLocaleOptions(locale)

  const found = await payload.find({
    collection: 'posts',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
    ...locOpts,
  })

  if (!found.docs.length) {
    return createPageMetadata({
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
      path: `/posts/${slug}`,
      noIndex: true,
    })
  }

  const doc = found.docs[0] as PostSeoDoc
  const title =
    doc.seo?.metaTitle || pickLocalizedString(doc.title, locale) || 'DPICS Post'
  const description =
    doc.seo?.metaDescription ||
    pickLocalizedString(doc.excerpt, locale) ||
    'Read this article from DPI Computing Society.'

  const siteSettings = (await (payload as any).findGlobal({ slug: 'site-settings' })) as { posts?: { authorName?: string } }
  const author = siteSettings.posts?.authorName || 'DPICS Team'

  const imageUrl =
    doc.featuredImage && typeof doc.featuredImage === 'object' ? doc.featuredImage.url : undefined

  return createPageMetadata({
    title,
    description,
    path: `/posts/${slug}`,
    image: imageUrl || undefined,
    openGraphType: 'article',
    publishedTime: doc.publishedAt,
    modifiedTime: doc.updatedAt || doc.publishedAt,
    authors: author ? [author] : undefined,
  })
}

export default function PostSlugLayout({ children }: { children: ReactNode }) {
  return children
}

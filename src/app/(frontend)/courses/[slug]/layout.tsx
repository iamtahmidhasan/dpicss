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

type CourseSeoDoc = {
  title?: unknown
  shortDescription?: unknown
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
  } | null
  thumbnail?: { url?: string | null } | string | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await Promise.resolve(params)
  const slug = resolved.slug
  const locale = await getRequestLocale()
  const payload = await getPayloadWithRetry()
  const locOpts = payloadLocaleOptions(locale)

  const found = await payload.find({
    collection: 'courses',
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
      title: 'Course Not Found',
      description: 'The requested course could not be found.',
      path: `/courses/${slug}`,
      noIndex: true,
    })
  }

  const doc = found.docs[0] as CourseSeoDoc
  const title = doc.seo?.metaTitle || pickLocalizedString(doc.title, locale) || 'Robotics Course'
  const description =
    doc.seo?.metaDescription ||
    pickLocalizedString(doc.shortDescription, locale) ||
    'Explore this robotics course from DPI Computing Society.'

  const imageUrl =
    doc.thumbnail && typeof doc.thumbnail === 'object' ? doc.thumbnail.url : undefined

  return createPageMetadata({
    title,
    description,
    path: `/courses/${slug}`,
    image: imageUrl || undefined,
    twitterCreator: process.env.NEXT_PUBLIC_TWITTER_SITE || undefined,
  })
}

export default function CourseSlugLayout({ children }: { children: ReactNode }) {
  return children
}

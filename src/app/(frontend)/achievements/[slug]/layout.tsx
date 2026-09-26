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

type AchievementSeoDoc = {
  title?: unknown
  summary?: unknown
  seo?: {
    metaTitle?: string | null
    metaDescription?: string | null
  } | null
  coverImage?: { url?: string | null } | string | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await Promise.resolve(params)
  const slug = resolved.slug
  const locale = await getRequestLocale()
  const payload = await getPayloadWithRetry()
  const locOpts = payloadLocaleOptions(locale)

  const found = await payload.find({
    collection: 'achievements',
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
      title: 'Achievement Not Found',
      description: 'The requested achievement could not be found.',
      path: `/achievements/${slug}`,
      noIndex: true,
    })
  }

  const doc = found.docs[0] as AchievementSeoDoc
  const title = doc.seo?.metaTitle || pickLocalizedString(doc.title, locale) || 'DPIRC Achievement'
  const description =
    doc.seo?.metaDescription ||
    pickLocalizedString(doc.summary, locale) ||
    'Discover this achievement from DPI Robotics Club.'

  const imageUrl =
    doc.coverImage && typeof doc.coverImage === 'object' ? doc.coverImage.url : undefined

  return createPageMetadata({
    title,
    description,
    path: `/achievements/${slug}`,
    image: imageUrl || undefined,
  })
}

export default function AchievementSlugLayout({ children }: { children: ReactNode }) {
  return children
}

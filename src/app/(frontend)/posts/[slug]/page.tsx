import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getPayloadWithRetry } from '@/lib/payload-safe'

import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { JsonLd } from '@/components/seo/JsonLd'
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo-structured'
import { Separator } from '@/components/ui/separator'
import type { PostsSettingsData } from '@/globals/types'

type MediaDoc = {
  id: string
  url?: string
  alt?: string
  filename?: string
  mimeType?: string
  width?: number
  height?: number
}

type PostDoc = {
  id: string
  title?: unknown
  slug?: string
  excerpt?: unknown
  content?: unknown
  publishedAt?: string
  updatedAt?: string
  readingTime?: number
  featuredImage?: MediaDoc | string | null
}

type SiteSettingsDoc = {
  posts?: {
    authorName?: string
    authorImage?: MediaDoc | string | null
  }
}

function getMediaUrl(media: MediaDoc | string | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'string') return media
  if (typeof media === 'object' && 'url' in media) {
    return media.url || null
  }
  return null
}

function getMediaProps(media: MediaDoc | string | null | undefined): {
  url: string | null
  alt: string
  width?: number
  height?: number
} {
  if (!media) return { url: null, alt: '' }
  if (typeof media === 'string') return { url: media, alt: '' }
  if (typeof media === 'object') {
    const m = media as MediaDoc
    return {
      url: m.url || null,
      alt: m.alt || '',
      width: m.width,
      height: m.height,
    }
  }
  return { url: null, alt: '' }
}

export default async function PostDetailsPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug

  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const postsSettings = await getGlobalPayload<PostsSettingsData>('posts-settings', locale)

  const result = await payload.find({
    collection: 'posts',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
    limit: 1,
    depth: 1,
    overrideAccess: true,
    ...locOpts,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const post = result.docs[0] as PostDoc
  const content = post.content
  const title = pickLocalizedString(post.title, locale) || postsSettings.untitled
  const excerpt = pickLocalizedString(post.excerpt, locale)
  const featuredImage = getMediaProps(post.featuredImage)

  const siteSettings = (await (payload as any).findGlobal({ slug: 'site-settings' })) as SiteSettingsDoc
  const authorName = siteSettings.posts?.authorName || 'DPICS Team'
  const authorImage = getMediaProps(siteSettings.posts?.authorImage)

  const postSchema = articleJsonLd({
    urlPath: `/posts/${slug}`,
    title,
    description: excerpt || 'Robotics article from DPI Computing Society.',
    image: featuredImage.url || undefined,
    publishedAt: post.publishedAt,
    modifiedAt: post.updatedAt || post.publishedAt,
    authorName,
  })
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Home', urlPath: '/' },
    { name: 'Posts', urlPath: '/posts' },
    { name: title, urlPath: `/posts/${slug}` },
  ])

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <JsonLd data={[postSchema, breadcrumbSchema]} />
      <article>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
          {authorImage.url && (
            <img
              src={authorImage.url}
              alt={authorName}
              className="h-8 w-8 rounded-full object-cover"
            />
          )}
          <span>{authorName}</span>
          <Separator orientation="vertical" className="h-4" />
          {post.publishedAt && (
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
          {post.readingTime && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span>{postsSettings.minRead.replace('{m}', String(post.readingTime))}</span>
            </>
          )}
        </div>

        {featuredImage.url && (
          <div className="mt-8 relative w-full overflow-hidden rounded-xl">
            <img
              src={featuredImage.url}
              alt={featuredImage.alt || title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {excerpt && <p className="mt-8 text-xl text-muted-foreground leading-relaxed">{excerpt}</p>}

        <Separator className="my-8" />

        {typeof content === 'object' && content !== null && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <RichTextRenderer data={content} />
          </div>
        )}
      </article>
    </main>
  )
}

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string }
}

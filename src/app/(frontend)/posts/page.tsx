import Link from 'next/link'
import { getPayloadWithRetry } from '@/lib/payload-safe'

import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { getCache, setCache } from '@/lib/cache'
import Image from 'next/image'
import type { PostsSettingsData } from '@/globals/types'

type PostCard = {
  id: string
  title?: unknown
  slug?: string
  excerpt?: unknown
  publishedAt?: string
  readingTime?: number
  featuredImage?: { url?: string } | null
}

export default async function PostsPage() {
  const payloadConfig = await config
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const postsSettings = await getGlobalPayload<PostsSettingsData>('posts-settings', locale)

  // Cache key for posts (15 minute TTL)
  const cacheKey = `posts:${locale}:published`
  const cached = await getCache<{ docs: unknown[] }>(cacheKey)

  let docs: PostCard[]

  if (cached) {
    docs = cached.docs as PostCard[]
  } else {
    const posts = await payload.find({
      collection: 'posts',
      where: {
        status: { equals: 'published' },
      },
      sort: '-publishedAt',
      limit: 24,
      depth: 1,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        readingTime: true,
        category: true,
        author: true,
        tags: true,
      },
      ...locOpts,
    })

    docs = posts.docs as PostCard[]

    // Cache for 15 minutes
    await setCache(cacheKey, { docs: posts.docs }, 900)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">{postsSettings.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{postsSettings.subtitle}</p>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">{postsSettings.empty}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((post) => {
            const title = pickLocalizedString(post.title, locale) || postsSettings.untitled
            const excerpt = pickLocalizedString(post.excerpt, locale)
            return (
              <article key={post.id} className="overflow-hidden rounded-lg border bg-card">
                {post.featuredImage &&
                typeof post.featuredImage === 'object' &&
                post.featuredImage.url ? (
                  <Image
                    width={1200}
                    height={800}
                    src={post.featuredImage.url}
                    alt={title}
                    className="h-44 w-full object-cover"
                  />
                ) : null}
                <div className="p-4">
                  <h2 className="line-clamp-2 text-lg font-medium">
                    <Link href={`/posts/${post.slug}`} className="hover:underline">
                      {title}
                    </Link>
                  </h2>
                  {excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {post.readingTime
                        ? postsSettings.minRead.replace('{m}', String(post.readingTime))
                        : postsSettings.quickRead}
                    </span>
                    <span>
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString(dateLocale)
                        : ''}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}

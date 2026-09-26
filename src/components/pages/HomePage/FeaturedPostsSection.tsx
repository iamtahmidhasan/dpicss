'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ExternalLink, Clock, Eye, Heart, Calendar, Code2 } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

type PostData = {
  id: string
  slug?: string
  title?: string
  excerpt?: string
  featuredImage?: { url?: string } | string
  category?: { title?: string; slug?: string }
  author?: { firstName?: string; lastName?: string; avatar?: { url?: string } }
  publishedAt?: string
  readingTime?: number
  viewCount?: number
  likeCount?: number
}

type FeaturedPostsSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  posts: PostData[]
  className?: string
}

function formatDate(dateString?: string) {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export default function FeaturedPostsSection({
  lang,
  homeSettings,
  posts,
  className,
}: FeaturedPostsSectionProps) {
  if (!posts || posts.length === 0) return null

  const getThumbnail = (img: any) => {
    if (typeof img === 'object' && img?.url) return img.url
    if (typeof img === 'string') return img
    return 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200'
  }

  const featuredPost = posts[0]
  const secondaryPosts = posts.slice(1, 4)

  return (
    <section className={cn('px-4 py-10 mx-auto max-w-7xl md:py-10', className)}>
      <div className="w-full">
        <div className="mb-16 flex flex-col gap-5 lg:w-2/3">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {localizedField(homeSettings.postsSection?.title, lang) || 'Latest Updates'}
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
            {localizedField(homeSettings.postsSection?.subtitle, lang) ||
              'Stay informed with the latest news, tutorials, and insights from the world of robotics.'}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-muted p-8 lg:col-span-2 lg:row-span-2 min-h-[400px]"
          >
            <div className="absolute inset-0 z-0">
              <Image
                src={getThumbnail(featuredPost.featuredImage)}
                alt={featuredPost.title || 'Post'}
                width={1200}
                height={800}
                quality={80}
                className="h-full w-full object-cover opacity-30 grayscale transition-all duration-500 group-hover:scale-105 group-active:scale-105 group-active:grayscale-0 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            <div className="relative z-10">
              <div className="flex gap-2 mb-4">
                {featuredPost.category?.title && (
                  <Badge className="bg-primary/10 text-primary border-none">
                    {featuredPost.category.title}
                  </Badge>
                )}
                {featuredPost.readingTime && (
                  <Badge
                    variant="outline"
                    className="bg-background/20 backdrop-blur-md border-white/20"
                  >
                    <Clock className="size-3 mr-1" />
                    {featuredPost.readingTime} min read
                  </Badge>
                )}
              </div>

              <h3 className="text-3xl font-semibold mb-4 text-gray-700">{featuredPost.title}</h3>
              <p className="max-w-md text-muted-foreground text-lg mb-6 line-clamp-2">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                {featuredPost.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4" />
                    {formatDate(featuredPost.publishedAt)}
                  </span>
                )}
                {featuredPost.viewCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Eye className="size-4" />
                    {featuredPost.viewCount} views
                  </span>
                )}
                {featuredPost.likeCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <Heart className="size-4" />
                    {featuredPost.likeCount}
                  </span>
                )}
              </div>

              <Link
                href={`/posts/${featuredPost.slug || featuredPost.id}`}
                className="mt-6 inline-flex items-center gap-2 text-primary font-medium hover:underline transition-all"
              >
                Read More <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>

          {secondaryPosts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:bg-muted/50"
            >
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Code2 className="size-6" />
                  </div>
                  {post.category?.title && (
                    <Badge variant="outline" className="rounded-full">
                      {post.category.title}
                    </Badge>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-3">{post.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {post.readingTime} min
                    </span>
                  )}
                  {post.viewCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="size-3.5" />
                      {post.viewCount}
                    </span>
                  )}
                </div>
                <Link
                  href={`/posts/${post.slug || post.id}`}
                  className="flex items-center gap-2 text-sm font-semibold hover:underline"
                >
                  Read <ExternalLink className="size-3" />
                </Link>
              </div>

              <span className="absolute -bottom-4 -right-2 text-8xl font-bold opacity-[0.03] select-none pointer-events-none">
                0{idx + 2}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 flex flex-col items-center gap-4"
        >
          <Button asChild variant="outline" size="lg" className="rounded-full border-2">
            <Link href="/posts">
              View All Posts
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

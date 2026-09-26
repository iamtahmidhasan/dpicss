import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@/payload.config'
import { CalendarDays, MapPin, Trophy, Users } from 'lucide-react'
import {
  convertLexicalToHTMLAsync,
  defaultHTMLConvertersAsync,
} from '@payloadcms/richtext-lexical/html-async'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd, creativeWorkJsonLd } from '@/lib/seo-structured'
import type { AchievementsSettingsData } from '@/globals/types'

type AchievementDoc = {
  id: string
  title?: unknown
  slug?: string
  summary?: unknown
  content?: unknown
  achievementDate?: string
  venue?: unknown
  organizer?: unknown
  badge?: unknown
  coverImage?: { url?: string } | null
  gallery?: Array<{
    image?: { url?: string } | null
    caption?: unknown
  }>
}

type PageProps = {
  params: Promise<{ slug: string }> | { slug: string }
}

async function richTextToHtml(data: unknown): Promise<string> {
  if (!data || typeof data !== 'object') return ''
  try {
    return await convertLexicalToHTMLAsync({
      converters: defaultHTMLConvertersAsync,
      data: data as never,
    })
  } catch {
    return ''
  }
}

export default async function AchievementSinglePage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const settings = await getGlobalPayload<AchievementsSettingsData>('achievements-settings', locale)

  const result = await payload.find({
    collection: 'achievements',
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
    depth: 2,
    limit: 1,
    overrideAccess: true,
    ...locOpts,
  })

  if (!result.docs.length) notFound()
  const achievement = result.docs[0] as AchievementDoc

  const title = pickLocalizedString(achievement.title, locale) || settings.untitled
  const summary = pickLocalizedString(achievement.summary, locale)
  const badge = pickLocalizedString(achievement.badge, locale)
  const venue = pickLocalizedString(achievement.venue, locale)
  const organizer = pickLocalizedString(achievement.organizer, locale)
  const contentHtml = await richTextToHtml(achievement.content)
  const achievementSchema = creativeWorkJsonLd({
    urlPath: `/achievements/${slug}`,
    title,
    description: summary || undefined,
    image: achievement.coverImage?.url || undefined,
    datePublished: achievement.achievementDate,
  })
  const breadcrumbSchema = breadcrumbJsonLd([
    { name: 'Home', urlPath: '/' },
    { name: 'Achievements', urlPath: '/achievements' },
    { name: title, urlPath: `/achievements/${slug}` },
  ])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <JsonLd data={[achievementSchema, breadcrumbSchema]} />
      <div className="mb-8">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/achievements">{settings.backToList}</Link>
        </Button>
      </div>

      <article className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          {achievement.coverImage?.url ? (
            <img
              src={achievement.coverImage.url}
              alt={title}
              className="max-h-105 w-full rounded-xl border object-cover"
            />
          ) : null}

          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{settings.badgeLabel}</Badge>
              {badge ? <Badge variant="outline">{badge}</Badge> : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            {summary ? <p className="text-lg text-muted-foreground">{summary}</p> : null}
          </header>

          <Separator />

          {contentHtml ? (
            <section
              className="prose prose-neutral max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{settings.noContent}</p>
          )}

          {achievement.gallery?.length ? (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">{settings.galleryTitle}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {achievement.gallery.map((item, idx) => {
                  const caption = pickLocalizedString(item.caption, locale)
                  return item.image?.url ? (
                    <figure
                      key={`${item.image.url}-${idx}`}
                      className="overflow-hidden rounded-lg border"
                    >
                      <img
                        src={item.image.url}
                        alt={caption || title}
                        className="aspect-video w-full object-cover"
                      />
                      {caption ? (
                        <figcaption className="border-t bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                          {caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ) : null
                })}
              </div>
            </section>
          ) : null}
        </section>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{settings.detailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">{settings.dateLabel}</p>
                  <p className="text-muted-foreground">
                    {achievement.achievementDate
                      ? new Date(achievement.achievementDate).toLocaleDateString(dateLocale)
                      : settings.unknownDate}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">{settings.venueLabel}</p>
                  <p className="text-muted-foreground">
                    {venue || settings.notProvided}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">{settings.organizerLabel}</p>
                  <p className="text-muted-foreground">
                    {organizer || settings.notProvided}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Trophy className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium">{settings.recognitionLabel}</p>
                  <p className="text-muted-foreground">
                    {badge || settings.notProvided}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </article>
    </main>
  )
}

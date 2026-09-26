import Link from 'next/link'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@/payload.config'
import { CalendarDays, ChevronRight, Trophy } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { AchievementsSettingsData } from '@/globals/types'

type AchievementCard = {
  id: string
  title?: unknown
  slug?: string
  summary?: unknown
  badge?: unknown
  achievementDate?: string
  featured?: boolean
  coverImage?: { url?: string } | null
}

export default async function AchievementsPage() {
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const achievementsSettings = await getGlobalPayload<AchievementsSettingsData>('achievements-settings', locale)

  const result = await payload.find({
    collection: 'achievements',
    where: { status: { equals: 'published' } },
    sort: '-achievementDate',
    limit: 50,
    depth: 2,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      description: true,
      badge: true,
      achievementDate: true,
      venue: true,
      organizer: true,
      coverImage: true,
      featured: true,
      status: true,
      participant: true,
      prize: true,
    },
    overrideAccess: true,
    ...locOpts,
  })

  const docs = result.docs as AchievementCard[]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{achievementsSettings.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {achievementsSettings.subtitle}
          </p>
        </div>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          {achievementsSettings.empty}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((item) => {
            const title =
              pickLocalizedString(item.title, locale) || achievementsSettings.untitled
            const summary = pickLocalizedString(item.summary, locale)
            const badge = pickLocalizedString(item.badge, locale)

            return (
              <Card key={item.id} className="flex h-full flex-col overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {item.coverImage?.url ? (
                    <img
                      src={item.coverImage.url}
                      alt={title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Trophy className="size-10 text-muted-foreground/60" />
                    </div>
                  )}
                  {item.featured ? (
                    <Badge className="absolute left-3 top-3" variant="secondary">
                      {achievementsSettings.featured}
                    </Badge>
                  ) : null}
                </div>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {item.achievementDate
                        ? new Date(item.achievementDate).toLocaleDateString(dateLocale)
                        : achievementsSettings.unknownDate}
                    </span>
                    {badge ? <Badge variant="outline">{badge}</Badge> : null}
                  </div>
                  <CardTitle className="line-clamp-2 text-xl">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  {summary ? (
                    <p className="line-clamp-4 text-sm text-muted-foreground">{summary}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {achievementsSettings.noSummary}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/achievements/${item.slug}`}>
                      {achievementsSettings.viewDetails}
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}

import Link from 'next/link'
import { type Where } from 'payload'
import { Users, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { TeamFilters } from '@/components/teams/TeamFilters'
import type { TeamsSettingsData } from '@/globals/types'
import type { Metadata } from 'next'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Category = {
  id: string
  name?: unknown
}

type Member = {
  id: string
  slug?: string
  username?: string
  memberId?: string
  avatar?: { url?: string } | string | null
  firstName?: string
  lastName?: string
  bio?: string
}

type TeamCard = {
  id: string
  name?: unknown
  slug?: string
  tagline?: unknown
  featuredImage?: { url?: string } | string | null
  members?: Member[]
  category?: Category | null
  featured?: boolean
}

export const metadata: Metadata = {
  title: 'Teams | DPI Robotics Club',
  description: 'Meet the teams behind DPI Robotics Club innovations and projects',
}

function formatMemberName(member: Member): string {
  const first = member.firstName || ''
  const last = member.lastName || ''
  return `${first} ${last}`.trim() || 'Member'
}

function getInitials(member: Member): string {
  const first = member.firstName?.[0] || ''
  const last = member.lastName?.[0] || ''
  return `${first}${last}`.toUpperCase() || 'M'
}

function resolveAvatarUrl(avatar: Member['avatar']): string | undefined {
  if (!avatar) return undefined
  if (typeof avatar === 'object' && 'url' in avatar) {
    return avatar.url
  }
  return undefined
}

export default async function TeamsPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await Promise.resolve(searchParams)
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const teamsSettings = await getGlobalPayload<TeamsSettingsData>('teams-settings', locale)

  const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : ''
  const categoryId = typeof resolvedSearchParams.category === 'string' ? resolvedSearchParams.category : ''

  const whereConditions: Where[] = [
    { status: { equals: 'published' } },
  ]

  if (search) {
    whereConditions.push({
      or: [
        { name: { like: search } },
        { tagline: { like: search } },
      ],
    })
  }

  if (categoryId) {
    whereConditions.push({ category: { equals: categoryId } })
  }

  const [teamsResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: 'teams' as any,
      where: { and: whereConditions },
      sort: ['featured', '-order'],
      limit: 50,
      depth: 1,
      overrideAccess: true,
      ...locOpts,
    }),
    payload.find({
      collection: 'categories',
      where: { and: [{ type: { equals: 'team' } }, { status: { equals: 'active' } }] },
      sort: 'order',
      limit: 50,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const docs = teamsResult.docs as TeamCard[]
  const categories = categoriesResult.docs as Category[]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{teamsSettings.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {teamsSettings.subtitle}
          </p>
        </div>
      </div>

      <TeamFilters categories={categories} initialCategory={categoryId} />

      {docs.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed p-12 text-center">
          <Users className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            {teamsSettings.empty}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {teamsSettings.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((team) => {
            const name = pickLocalizedString(team.name, locale as 'en' | 'bn') || 'Unnamed Team'
            const tagline = pickLocalizedString(team.tagline, locale as 'en' | 'bn')
            const imageUrl =
              team.featuredImage && typeof team.featuredImage === 'object'
                ? team.featuredImage.url
                : undefined
            const members = team.members || []
            const categoryName = team.category
              ? pickLocalizedString(team.category.name, locale as 'en' | 'bn')
              : null

            return (
              <Link
                key={team.id}
                href={`/teams/${team.slug}`}
                className="group block"
              >
                <Card className="h-full overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:scale-[1.02]">
                  <div className="relative aspect-video bg-muted">
                    {imageUrl ? (
                      <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Users className="size-12 text-muted-foreground/40" />
                      </div>
                    )}
                    {team.featured && (
                      <Badge className="absolute left-3 top-3 flex items-center gap-1" variant="default">
                        <Star className="size-3 fill-current" />
                        {teamsSettings.featured}
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-xl leading-snug">
                        {name}
                      </CardTitle>
                      {categoryName && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {categoryName}
                        </Badge>
                      )}
                    </div>
                    {tagline && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {tagline}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center -space-x-2">
                        {members.slice(0, 4).map((member, idx) => (
                          <div
                            key={member.id || idx}
                            className="relative overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm"
                            style={{ zIndex: 4 - idx }}
                          >
                            <Avatar className="size-8">
                              <AvatarImage
                                src={resolveAvatarUrl(member.avatar)}
                                alt={formatMemberName(member)}
                              />
                              <AvatarFallback className="text-xs bg-primary/10">
                                {getInitials(member)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        ))}
                        {members.length > 4 && (
                          <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {members.length} {members.length === 1 ? 'member' : 'members'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}

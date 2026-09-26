import Link from 'next/link'
import { type Where } from 'payload'
import { Calendar, MapPin, Users, Ticket, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { EventsSettingsData } from '@/globals/types'
import type { Metadata } from 'next'

type Category = {
  id: string
  name?: unknown
}

type EventCard = {
  id: string
  name?: unknown
  slug?: string
  tagline?: unknown
  eventDate?: string
  endDate?: string
  venue?: unknown
  totalSeats?: number
  soldSeats?: number
  ticketPrice?: number
  ticketCurrency?: string
  featuredImage?: { url?: string } | string | null
  category?: Category | null
  status?: string
  featured?: boolean
}

export const metadata: Metadata = {
  title: 'Events | DPI Robotics Club',
  description: 'Upcoming events, workshops, and meetups from DPI Robotics Club.',
}

function formatEventDate(
  dateString: string,
  locale: string,
): {
  day: string
  month: string
  year: string
  time: string
} {
  const date = new Date(dateString)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'
  const day = date.toLocaleDateString(dateLocale, { day: 'numeric' })
  const month = date.toLocaleDateString(dateLocale, { month: 'short' })
  const year = date.toLocaleDateString(dateLocale, { year: 'numeric' })
  const time = date.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
  return { day, month, year, time }
}

function getAvailableSeats(total?: number, sold?: number): number {
  return Math.max(0, (total || 0) - (sold || 0))
}

function getEventStatus(
  eventDate?: string,
  status?: string,
): {
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
} {
  if (status === 'cancelled') return { label: 'Cancelled', variant: 'destructive' as const }
  if (status === 'completed') return { label: 'Completed', variant: 'secondary' as const }

  if (eventDate) {
    const now = new Date()
    const eventDateObj = new Date(eventDate)
    if (eventDateObj < now) return { label: 'Ended', variant: 'secondary' as const }

    const diffDays = Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return { label: 'Starting Soon', variant: 'default' as const }
    if (diffDays <= 7) return { label: 'This Week', variant: 'default' as const }
  }

  return { label: 'Upcoming', variant: 'outline' as const }
}

export default async function EventsPage() {
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const eventsSettings = await getGlobalPayload<EventsSettingsData>('events-settings', locale)

  const result = await payload.find({
    collection: 'events' as any,
    where: { status: { equals: 'published' } },
    sort: ['featured', '-order', 'eventDate'],
    limit: 50,
    depth: 0,
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      eventDate: true,
      endDate: true,
      venue: true,
      totalSeats: true,
      soldSeats: true,
      ticketPrice: true,
      ticketCurrency: true,
      featuredImage: true,
      category: true,
      status: true,
      featured: true,
      order: true,
      organizer: true,
      description: true,
      registrationLink: true,
    },
    overrideAccess: true,
    ...locOpts,
  })

  const docs = result.docs as EventCard[]

  const upcomingEvents = docs.filter((e) => {
    if (!e.eventDate) return false
    return new Date(e.eventDate) >= new Date()
  })

  const pastEvents = docs.filter((e) => {
    if (!e.eventDate) return false
    return new Date(e.eventDate) < new Date()
  })

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{eventsSettings.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {eventsSettings.subtitle}
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Calendar className="mx-auto mb-4 size-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">{eventsSettings.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {eventsSettings.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 h-full w-px bg-border md:left-1/2 md:-translate-x-px" />

          <div className="space-y-8">
            {upcomingEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <Ticket className="size-5 text-primary" />
                  {eventsSettings.upcoming}
                </h2>
                <div className="space-y-6">
                  {upcomingEvents.map((event) => (
                    <EventTimelineCard
                      key={event.id}
                      event={event}
                      locale={locale}
                      dateLocale={dateLocale}
                      isPast={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div className="opacity-75">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                  <Clock className="size-5" />
                  {eventsSettings.past}
                </h2>
                <div className="space-y-6">
                  {pastEvents.map((event) => (
                    <EventTimelineCard
                      key={event.id}
                      event={event}
                      locale={locale}
                      dateLocale={dateLocale}
                      isPast={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

function EventTimelineCard({
  event,
  locale,
  dateLocale,
  isPast,
}: {
  event: EventCard
  locale: string
  dateLocale: string
  isPast: boolean
}) {
  const name = pickLocalizedString(event.name, locale as 'en' | 'bn') || 'Unnamed Event'
  const tagline = pickLocalizedString(event.tagline, locale as 'en' | 'bn')
  const venue = pickLocalizedString(event.venue, locale as 'en' | 'bn')
  const categoryName = event.category
    ? pickLocalizedString(event.category.name, locale as 'en' | 'bn')
    : null
  const imageUrl =
    event.featuredImage && typeof event.featuredImage === 'object'
      ? event.featuredImage.url
      : undefined

  const eventDateInfo = event.eventDate ? formatEventDate(event.eventDate, dateLocale) : null
  const statusInfo = getEventStatus(event.eventDate, event.status)
  const availableSeats = getAvailableSeats(event.totalSeats, event.soldSeats)
  const isSoldOut = availableSeats === 0
  const currency = event.ticketCurrency === 'USD' ? '$' : '৳'

  return (
    <div className={`relative pl-16 md:pl-0 ${isPast ? 'md:opacity-50' : ''}`}>
      <div className="absolute left-8 -translate-x-1/2 rounded-full border-2 border-background bg-primary p-2 md:left-1/2 md:-translate-x-1/2">
        <Calendar className="size-4 text-primary-foreground" />
      </div>

      <Link href={`/events/${event.slug}`} className="block">
        <Card
          className={`ml-8 overflow-hidden transition-all hover:shadow-lg md:ml-0 ${isPast ? 'hover:shadow-md' : 'hover:border-primary/30'}`}
        >
          <div className="flex flex-col md:flex-row">
            {eventDateInfo && (
              <div className="flex flex-col items-center justify-center bg-primary/5 p-4 md:w-24">
                <span className="text-3xl font-bold text-primary">{eventDateInfo.day}</span>
                <span className="text-sm font-medium uppercase text-primary">
                  {eventDateInfo.month}
                </span>
                <span className="text-xs text-muted-foreground">{eventDateInfo.year}</span>
                <span className="mt-1 text-xs font-medium text-primary">{eventDateInfo.time}</span>
              </div>
            )}

            <div className="flex flex-1 flex-col">
              <CardContent className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {event.featured && <Badge variant="default">Featured</Badge>}
                    {categoryName && <Badge variant="outline">{categoryName}</Badge>}
                  </div>
                  {event.ticketPrice !== undefined && event.ticketPrice > 0 && (
                    <span className="text-lg font-semibold">
                      {currency}
                      {event.ticketPrice}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-xl font-semibold line-clamp-1">{name}</h3>
                {tagline && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{tagline}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {venue && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-4" />
                      {venue}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="size-4" />
                    {availableSeats > 0 ? (
                      <>{(event.totalSeats || 0) - (event.soldSeats || 0)} seats left</>
                    ) : (
                      <span className="text-destructive">Sold Out</span>
                    )}
                  </span>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  )
}

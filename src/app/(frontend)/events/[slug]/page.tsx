import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowLeft, Ticket, Clock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getCurrentUser } from '@/lib/payload-auth'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { BuyTicketDialog } from '@/components/events/BuyTicketDialog'
import type { Metadata } from 'next'
import type { EventsSettingsData } from '@/globals/types'

type PaymentMethod = {
  method: string
  accountNumber?: string
}

type Organizer = {
  id: string
  firstName?: string
  lastName?: string
  avatar?: { url?: string } | string | null
}

type Category = {
  id: string
  name?: unknown
}

type EventDetail = {
  id: string
  name?: unknown
  slug?: string
  tagline?: unknown
  description?: unknown
  content?: unknown
  eventDate?: string
  endDate?: string
  venue?: unknown
  totalSeats?: number
  soldSeats?: number
  ticketPrice?: number
  ticketCurrency?: string
  featuredImage?: { url?: string } | string | null
  category?: Category | null
  organizer?: Organizer | null
  paymentMethods?: PaymentMethod[]
  status?: string
  featured?: boolean
  contact?: {
    whatsappNumber?: string
    email?: string
  }
  meta?: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    ogTitle?: string
    ogDescription?: string
    twitterCard?: string
    twitterTitle?: string
    twitterDescription?: string
  }
}

function formatOrganizerName(org?: Organizer): string {
  if (!org) return 'DPIRC'
  const first = org.firstName || ''
  const last = org.lastName || ''
  return `${first} ${last}`.trim() || 'DPIRC'
}

function getInitials(org?: Organizer): string {
  if (!org) return 'DPI'
  const first = org.firstName?.[0] || ''
  const last = org.lastName?.[0] || ''
  return `${first}${last}`.toUpperCase() || 'DPI'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()

  const result = await payload.find({
    collection: 'events' as any,
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  })

  if (result.docs.length === 0) {
    return { title: 'Event Not Found | DPI Robotics Club' }
  }

  const event = result.docs[0] as EventDetail
  const name = pickLocalizedString(event.name, locale) || 'Event'
  const tagline = pickLocalizedString(event.tagline, locale)

  const ogImage =
    event.featuredImage && typeof event.featuredImage === 'object' && event.featuredImage.url
      ? event.featuredImage.url
      : undefined

  return {
    title: event.meta?.metaTitle || `${name} | DPI Robotics Club`,
    description: event.meta?.metaDescription || tagline || undefined,
    keywords: event.meta?.metaKeywords
      ? event.meta.metaKeywords.split(',').map((k) => k.trim())
      : undefined,
    openGraph: {
      title: event.meta?.ogTitle || name,
      description: event.meta?.ogDescription || tagline,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: event.meta?.twitterCard
      ? {
          card: event.meta.twitterCard as 'summary' | 'summary_large_image',
          title: event.meta?.twitterTitle || name,
          description: event.meta?.twitterDescription || tagline,
          images: ogImage ? [ogImage] : undefined,
        }
      : undefined,
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await Promise.resolve(params)
  const slug = resolvedParams.slug

  const payload = await getPayloadWithRetry()
  const currentUser = await getCurrentUser()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const dateLocale = locale === 'bn' ? 'bn-BD' : 'en-US'

  const s = await getGlobalPayload<EventsSettingsData>('events-settings', locale)

  const result = await payload.find({
    collection: 'events' as any,
    where: { and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }] },
    limit: 1,
    depth: 1,
    overrideAccess: true,
    ...locOpts,
  })

  if (result.docs.length === 0) {
    notFound()
  }

  const event = result.docs[0] as EventDetail
  const name = pickLocalizedString(event.name, locale) || 'Unnamed Event'
  const tagline = pickLocalizedString(event.tagline, locale)
  const description = pickLocalizedString(event.description, locale)
  const venue = pickLocalizedString(event.venue, locale)
  const categoryName = event.category
    ? pickLocalizedString(event.category.name, locale)
    : null
  const imageUrl =
    event.featuredImage && typeof event.featuredImage === 'object'
      ? event.featuredImage.url
      : undefined

  const availableSeats = Math.max(0, (event.totalSeats || 0) - (event.soldSeats || 0))
  const isSoldOut = availableSeats === 0
  const currency = event.ticketCurrency === 'USD' ? '$' : '৳'

  const eventDateFormatted = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString(dateLocale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const eventTimeFormatted = event.eventDate
    ? new Date(event.eventDate).toLocaleTimeString(dateLocale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const endDateFormatted = event.endDate
    ? new Date(event.endDate).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const isLoggedIn = Boolean(currentUser)
  const userEmail = currentUser?.email
  
  let userName = currentUser?.email || ''
  if (currentUser?.id) {
    try {
      const userWithProfile = await payload.findByID({
        collection: 'users',
        id: currentUser.id,
        depth: 2,
        overrideAccess: true,
      })
      
      const memberProfile =
        (userWithProfile?.officialMemberProfile as any) ||
        (userWithProfile?.unofficialMemberProfile as any)
      
      if (memberProfile) {
        const firstName = memberProfile.firstName || ''
        const lastName = memberProfile.lastName || ''
        userName = `${firstName} ${lastName}`.trim() || userEmail || ''
      }
    } catch {
      userName = userEmail || ''
    }
  }

  const dialogMessages = {
    buyTicket: s.buyTicket,
    close: 'Close',
    submit: s.submitTicket,
    loginRequired: s.loginRequired,
    loginFirst: s.loginFirst,
    buyerName: s.buyerName,
    buyerNamePlaceholder: s.buyerNamePlaceholder,
    buyerEmail: s.buyerEmail,
    buyerEmailPlaceholder: s.buyerEmailPlaceholder,
    buyerPhone: s.buyerPhone,
    buyerPhonePlaceholder: s.buyerPhonePlaceholder,
    quantity: s.quantity,
    paymentMethod: s.paymentMethod,
    selectPaymentMethod: s.selectPaymentMethod,
    transactionId: s.transactionId,
    transactionIdPlaceholder: s.transactionIdPlaceholder,
    transactionIdHelp: s.transactionIdHelp,
    total: s.total,
    success: s.success,
    successMessage: s.successMessage,
    error: s.error,
    errorMessage: s.errorMessage,
    soldOut: s.soldOut,
    notAvailable: s.notAvailable,
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Button asChild variant="ghost" className="mb-6 -ml-2">
        <Link href="/events">
          <ArrowLeft className="mr-2 size-4" />
          {s.backToEvents}
        </Link>
      </Button>

      <div className="mb-8">
        <div className="relative w-full overflow-hidden rounded-2xl bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="size-16 text-muted-foreground/40" />
            </div>
          )}
          {event.featured && (
            <Badge className="absolute left-4 top-4 flex items-center gap-1" variant="default">
              <Star className="size-3 fill-current" />
              {s.featured}
            </Badge>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
            {tagline && <p className="mt-2 text-lg text-muted-foreground">{tagline}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryName && <Badge variant="outline">{categoryName}</Badge>}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventDateFormatted && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Calendar className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium">{eventDateFormatted}</p>
                {eventTimeFormatted && (
                  <p className="text-xs text-muted-foreground">{eventTimeFormatted}</p>
                )}
              </div>
            </div>
          )}
          {venue && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <MapPin className="size-5 text-primary" />
              <p className="text-sm font-medium">{venue}</p>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Users className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {isSoldOut ? (
                  <span className="text-destructive">{s.soldOut}</span>
                ) : (
                  <>
                    {availableSeats} {s.seatsAvailable}
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {(event.totalSeats || 0) - (event.soldSeats || 0)} / {event.totalSeats || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {description && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          )}

          {typeof event.content === 'object' && event.content && (
            <>
              <h2 className="mb-4 text-xl font-semibold">{s.eventDetails}</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <RichTextRenderer data={event.content as object} />
              </div>
            </>
          )}

          {event.organizer && (
            <div className="mt-8">
              <h3 className="mb-4 text-lg font-semibold">{s.organizer}</h3>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Avatar>
                  <AvatarImage
                    src={
                      event.organizer.avatar && typeof event.organizer.avatar === 'object'
                        ? event.organizer.avatar.url
                        : undefined
                    }
                    alt={formatOrganizerName(event.organizer)}
                  />
                  <AvatarFallback className="bg-primary/10">
                    {getInitials(event.organizer)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{formatOrganizerName(event.organizer)}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.organizerRole}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium">{s.ticketPrice}</span>
                  {event.ticketPrice !== undefined && event.ticketPrice > 0 ? (
                    <span className="text-2xl font-bold">
                      {currency}
                      {event.ticketPrice}
                      <span className="text-sm font-normal text-muted-foreground"> / ticket</span>
                    </span>
                  ) : (
                    <Badge variant="default">{s.freeEvent}</Badge>
                  )}
                </div>

                <Separator className="my-4" />

                <BuyTicketDialog
                  event={{
                    id: event.id,
                    name: event.name,
                    ticketPrice: event.ticketPrice,
                    ticketCurrency: event.ticketCurrency,
                    paymentMethods: event.paymentMethods,
                    totalSeats: event.totalSeats,
                    soldSeats: event.soldSeats,
                  }}
                  isLoggedIn={isLoggedIn}
                  userEmail={userEmail}
                  userName={typeof userName === 'string' ? userName : undefined}
                  messages={dialogMessages}
                />

                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-medium">{s.quickInfo}</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {event.eventDate && (
                      <div className="flex items-center gap-2">
                        <Clock className="size-4" />
                        <span>
                          {s.startsAt}: {eventTimeFormatted}
                        </span>
                      </div>
                    )}
                    {endDateFormatted && (
                      <div className="flex items-center gap-2">
                        <Clock className="size-4" />
                        <span>
                          {s.endsAt}: {endDateFormatted}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      <span>
                        {s.capacity}: {event.totalSeats || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {event.paymentMethods && event.paymentMethods.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-2 text-sm font-medium">
                      {s.acceptedPayments}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {event.paymentMethods.map((pm) => (
                        <Badge key={pm.method} variant="outline">
                          {pm.method === 'hand_to_hand' ? 'Cash' : pm.method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

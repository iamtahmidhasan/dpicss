'use client'

import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'
import { Button } from '@/components/ui/button'

type EventData = {
  id: string
  name: string
  slug?: string
  tagline?: string
  featuredImage?: { url?: string }
  eventDate?: string
  venue?: string
  ticketPrice?: number
  ticketCurrency?: string
  category?: { title?: string }
}

type FeaturedEventsSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  events: EventData[]
  className?: string
}

export default function FeaturedEventsSection({
  lang,
  homeSettings,
  events,
  className,
}: FeaturedEventsSectionProps) {
  if (!events || events.length === 0) return null

  const spotlight = events[0]
  const sidebarEvents = events.slice(1, 3)

  return (
    <section className={cn('py-10', className)}>
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Header Section */}
        <div className="mb-14 flex flex-col gap-5 lg:w-2/3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {localizedField(homeSettings.eventsSection?.title, lang) || 'Featured Events'}
          </h1>
          <p className="text-lg text-muted-foreground md:text-xl">
            {localizedField(homeSettings.eventsSection?.subtitle, lang) ||
              'Join our hands-on workshops and tech competitions.'}
          </p>
        </div>

        {/* Main Grid: Match About3 structure */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Large Image/Card (Col-span 2) */}
          <div className="relative group overflow-hidden rounded-xl lg:col-span-2">
            <img
              src={
                spotlight.featuredImage?.url ||
                'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200'
              }
              alt={spotlight.name}
              className="size-full max-h-[620px] object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
              <span className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
                Next Major Event
              </span>
              <h3 className="text-4xl font-bold mb-4">{spotlight.name}</h3>
              <Button asChild className="w-fit rounded-full">
                <Link href={`/events/${spotlight.slug}`}>View Details</Link>
              </Button>
            </div>
          </div>

          {/* Sidebar Section (Col-span 1) */}
          <div className="flex flex-col gap-4 md:flex-row lg:flex-col">
            {/* Breakout Info Box */}
            <div className="flex flex-col justify-between gap-6 rounded-xl bg-muted p-7 md:w-1/2 lg:w-auto">
              <Zap className="h-10 w-10 text-primary" />
              <div>
                <p className="mb-2 text-lg font-semibold">Full Schedule Available</p>
                <p className="text-muted-foreground text-sm">
                  Explore all upcoming workshops, training sessions, and global competitions.
                </p>
              </div>
              <Button variant="outline" className="mr-auto rounded-full" asChild>
                <Link href="/events">Browse All Events</Link>
              </Button>
            </div>

            {/* Secondary Event Image/Card */}
            {sidebarEvents[0] && (
              <Link
                href={`/events/${sidebarEvents[0].slug}`}
                className="group relative grow basis-0 rounded-xl overflow-hidden md:w-1/2 lg:min-h-0 lg:w-auto"
              >
                <img
                  src={
                    sidebarEvents[0].featuredImage?.url ||
                    'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800'
                  }
                  alt={sidebarEvents[0].name}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold">{sidebarEvents[0].name}</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

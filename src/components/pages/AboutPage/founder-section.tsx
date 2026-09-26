'use client'

import Autoplay from 'embla-carousel-autoplay'
import {
  Lightbulb,
  Trophy,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AboutSettingsData } from '@/globals/types'
import type { AppLocale } from '@/lib/locale'
import * as React from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel'

type GoverningMember = {
  id: string
  username?: string
  firstName?: string
  lastName?: string
  fullName?: string
  avatar?: string | { url?: string }
  bio?: string
  memberType?: string
  committeeRole?: string
}

interface FounderSectionProps {
  className?: string
  aboutSettings: AboutSettingsData
  lang: AppLocale
  members?: GoverningMember[]
}

export function FounderSection({ className, aboutSettings, lang, members }: FounderSectionProps) {
  const [api, setApi] = React.useState<CarouselApi>()

  const autoplay = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  )

  const title = aboutSettings.founder.title || 'Meet Our Leadership'
  const description =
    aboutSettings.founder.description ||
    'Guided by a passion for technology and a commitment to student excellence.'

  const governingMembers = members?.length ? members : []

  return (
    <section className={cn('py-10 md:py-10 px-4 mx-auto max-w-7xl', className)}>
      <div className="w-full">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-5 lg:w-2/3">
          <span className="w-fit rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {aboutSettings.founder.badge || 'Our Team'}
          </span>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">{title}</h2>
          <p className="text-lg text-muted-foreground md:text-xl">{description}</p>
        </div>

        {/* Visual Grid */}
        <div className="grid gap-7 lg:grid-cols-3">
          {/* Main Image Container - Carousel Slider */}
          <div className="relative overflow-hidden rounded-xl bg-muted lg:col-span-2 lg:h-[600px]">
            {governingMembers.length > 0 ? (
              <>
                <Carousel
                  setApi={setApi}
                  opts={{ align: 'start', loop: true }}
                  plugins={[autoplay.current]}
                  className="size-full"
                >
                  <CarouselContent>
                    {governingMembers.map((member) => {
                      const fullName =
                        member.fullName || `${member.firstName || ''} ${member.lastName || ''}`
                      const fallbackUrl =
                        'https://ui-avatars.com/api/?name=' +
                        encodeURIComponent(fullName || 'Member') +
                        '&background=6366f1&color=fff&size=400'
                      let avatarUrl = fallbackUrl
                      if (member.avatar) {
                        if (typeof member.avatar === 'string') {
                          avatarUrl = member.avatar
                        } else if (typeof member.avatar === 'object' && member.avatar !== null) {
                          const a = member.avatar as Record<string, any>
                          avatarUrl = a.imagekit?.url || a.imageKitUrl || a.url || fallbackUrl
                        }
                      }
                      return (
                        <CarouselItem key={member.id} className="relative h-full">
                          <Link
                            href={`/profile/${member.username || member.id}`}
                            className="group relative block h-[500px] lg:h-[600px]"
                          >
                            <img
                              src={avatarUrl}
                              alt={fullName}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-8 left-8 text-white">
                              <p className="text-sm font-medium uppercase tracking-widest opacity-80">
                                {member.memberType || 'Governing Body'}
                              </p>
                              <p className="text-3xl font-bold">{fullName}</p>
                            </div>
                            <div className="absolute left-4 top-4 z-10 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                              {member.committeeRole || 'Governing Body'}
                            </div>
                            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                              View Profile <ExternalLink className="size-3" />
                            </div>
                          </Link>
                        </CarouselItem>
                      )
                    })}
                  </CarouselContent>
                </Carousel>
                {governingMembers.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 lg:inline-flex"
                      onClick={() => api?.scrollPrev()}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 lg:inline-flex"
                      onClick={() => api?.scrollNext()}
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="relative h-[500px] lg:h-[600px]">
                  <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=1000&fit=crop"
                    alt="Founders and Team"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 text-white">
                    <p className="text-sm font-medium uppercase tracking-widest opacity-80">
                      Established
                    </p>
                    <p className="text-3xl font-bold">2025</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Stacked Cards */}
          <div className="flex flex-col gap-7">
            {/* Visionary Card */}
            <div className="group flex flex-col justify-between gap-6 rounded-xl bg-muted p-7 transition-all hover:bg-muted/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-2 text-xl font-semibold">
                  {aboutSettings.sharedVision.title || 'Shared Vision'}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {aboutSettings.sharedVision.description}
                </p>
              </div>
            </div>

            {/* Achievement Card */}
            <div className="flex flex-col justify-between gap-6 rounded-xl border p-7">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-600">
                  <Trophy className="h-5 w-5" />
                </div>
                <p className="font-semibold">{aboutSettings.leadership.title || 'Excellence'}</p>
              </div>
              <p className="text-sm text-muted-foreground">{aboutSettings.leadership.description}</p>
              <Button variant="ghost" className="group w-fit px-0 hover:bg-transparent" asChild>
                <Link href="/teams" className="flex items-center text-primary">
                  View Full Team
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Content Section */}
        <div className="mx-auto grid max-w-5xl gap-12 py-20 md:grid-cols-2 md:gap-20">
          <div className="flex flex-col gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Star className="h-4 w-4 fill-primary" />
            </div>
            <h3 className="text-3xl font-medium md:text-4xl">Our Leadership Philosophy</h3>
          </div>
          <div>
            <p className="whitespace-pre-line text-lg leading-8 text-muted-foreground">
              {aboutSettings.leadership.description2}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

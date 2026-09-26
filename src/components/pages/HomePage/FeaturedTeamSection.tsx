'use client'

import Autoplay from 'embla-carousel-autoplay'
import { Globe, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'

import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type MemberData = {
  id: string
  username?: string
  firstName?: string
  lastName?: string
  fullName?: string
  avatar?: string | { url?: string }
  bio?: string
  memberType?: string
  socialLinks?: {
    linkedin?: string
    github?: string
    website?: string
  }
}

type FeaturedTeamSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  members: MemberData[]
  className?: string
}

export default function FeaturedTeamSection({
  lang,
  homeSettings,
  members,
  className,
}: FeaturedTeamSectionProps) {
  const [api, setApi] = React.useState<CarouselApi>()

  const autoplay = React.useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  )

  if (!members?.length) return null

  return (
    <section className={cn('py-24', className)}>
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              {localizedField(homeSettings.teamSection?.title, lang) || 'Our Team'}
            </h2>

            <p className="mt-4 text-lg text-muted-foreground">
              {localizedField(homeSettings.teamSection?.subtitle, lang) || 'Meet the amazing people behind our journey.'}
            </p>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 md:flex">
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => api?.scrollPrev()}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={() => api?.scrollNext()}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[autoplay.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {members.map((member) => {
              const fullName =
                member.fullName || `${member.firstName || ''} ${member.lastName || ''}`
              const profileUrl = `/profile/${member.username || member.id}`

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
                  avatarUrl =
                    a.imagekit?.url || a.imageKitUrl || a.url || fallbackUrl
                }
              }

              return (
                <CarouselItem key={member.id} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                  <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-background transition-all hover:border-primary/20 hover:shadow-lg">
                    {/* Image with profile link overlay */}
                    <Link
                      href={profileUrl}
                      className="relative block aspect-[4/4.5] overflow-hidden bg-muted"
                    >
                      <img
                        src={avatarUrl}
                        alt={fullName}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                        <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium shadow-lg">
                          View Profile
                        </span>
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="secondary" className="truncate">
                          {member.memberType || 'Member'}
                        </Badge>
                        <Link
                          href={profileUrl}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          View Profile <ExternalLink className="ml-1 inline size-3" />
                        </Link>
                      </div>

                      <div className="mt-2 flex-1 space-y-2">
                        <Link href={profileUrl} className="block">
                          <h3 className="line-clamp-1 text-xl font-semibold tracking-tight transition-colors hover:text-primary">
                            {fullName}
                          </h3>
                        </Link>

                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {member.bio || 'Team member'}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center gap-2 pt-4">
                        {member.socialLinks?.linkedin && (
                          <a
                            href={member.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                          >
                            <Button variant="outline" size="icon">
                              <Globe className="size-4" />
                            </Button>
                          </a>
                        )}

                        {member.socialLinks?.github && (
                          <a
                            href={member.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                          >
                            <Button variant="outline" size="icon">
                              <Globe className="size-4" />
                            </Button>
                          </a>
                        )}

                        {member.socialLinks?.website && (
                          <a
                            href={member.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex"
                          >
                            <Button variant="outline" size="icon">
                              <Globe className="size-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>

        {/* Mobile Controls */}
        <div className="mt-8 flex items-center justify-center gap-3 md:hidden">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={() => api?.scrollPrev()}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={() => api?.scrollNext()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

'use client'

import Autoplay from 'embla-carousel-autoplay'
import { Target, Rocket, ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AboutSettingsData } from '@/globals/types'
import type { AppLocale } from '@/lib/locale'
import * as React from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from '@/components/ui/carousel'

type MemberSlide = {
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

interface MissionVisionProps {
  className?: string
  aboutSettings: AboutSettingsData
  lang: AppLocale
  alumniAdvisors?: MemberSlide[]
  executives?: MemberSlide[]
}

const SlideContent = ({ member, roleLabel }: { member: MemberSlide; roleLabel: string }) => {
  const fullName = member.fullName || `${member.firstName || ''} ${member.lastName || ''}`
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
    <Link
      href={`/profile/${member.username || member.id}`}
      className="group relative block h-full w-full"
    >
      <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <p className="text-xs font-medium uppercase tracking-widest opacity-80">
          {member.memberType || 'Member'}
        </p>
        <p className="text-xl font-bold">{fullName}</p>
      </div>
      <div className="absolute left-3 top-3 z-10 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
        {roleLabel}
      </div>
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-active:opacity-100">
        Profile <ExternalLink className="size-2.5" />
      </div>
    </Link>
  )
}

export function MissionVision({
  className,
  aboutSettings,
  lang,
  alumniAdvisors,
  executives,
}: MissionVisionProps) {
  const title = aboutSettings.missionVision.title || 'Mission & Vision'
  const description =
    aboutSettings.missionVision.description ||
    'Our purpose and aspirations for the future of computing and education.'

  const [advisorApi, setAdvisorApi] = React.useState<CarouselApi>()
  const [execApi, setExecApi] = React.useState<CarouselApi>()
  const advisorAutoplay = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }),
  )
  const execAutoplay = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }),
  )
  const hasAdvisors = alumniAdvisors && alumniAdvisors.length > 0
  const hasExecutives = executives && executives.length > 0

  return (
    <section className={cn('py-10 md:py-10 px-4 mx-auto max-w-7xl', className)}>
      <div className="w-full">
        {/* Header Section */}
        <div className="mb-14 flex flex-col gap-5 lg:w-2/3">
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">{title}</h2>
          <p className="text-lg text-muted-foreground md:text-xl">{description}</p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-7 lg:grid-cols-3">
          {/* Left Column: Alumni Advisors */}
          <div className="relative overflow-hidden rounded-xl bg-muted lg:col-span-2 lg:h-[500px]">
            {hasAdvisors ? (
              <>
                <Carousel
                  setApi={setAdvisorApi}
                  opts={{ align: 'start', loop: true }}
                  plugins={[advisorAutoplay.current]}
                  className="size-full"
                >
                  <CarouselContent>
                    {alumniAdvisors!.map((member) => (
                      <CarouselItem key={member.id} className="relative h-full">
                        <div className="relative lg:aspect-auto aspect-square lg:h-[500px]">
                          <SlideContent member={member} roleLabel={member.committeeRole || 'Alumni Advisor'} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                {hasAdvisors && alumniAdvisors!.length > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 lg:inline-flex"
                      onClick={() => advisorApi?.scrollPrev()}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 lg:inline-flex"
                      onClick={() => advisorApi?.scrollNext()}
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="relative flex flex-col justify-between p-8 md:p-12">
                <div className="relative z-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Target className="h-7 w-7" />
                  </div>
                  <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    {aboutSettings.mission.badge || 'Our Mission'}
                  </span>
                  <h3 className="mb-6 text-3xl font-semibold md:text-4xl">
                    {aboutSettings.mission.title}
                  </h3>
                  <p className="max-w-2xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                    {aboutSettings.mission.description}
                  </p>
                </div>
                <Target className="absolute -bottom-10 -right-10 h-64 w-64 opacity-[0.03] grayscale" />
              </div>
            )}
          </div>

          {/* Right Column: Executives & Action */}
          <div className="flex flex-col gap-7">
            {/* Executive Carousel */}
            <div className="relative overflow-hidden rounded-xl bg-primary lg:h-[280px]">
              {hasExecutives ? (
                <>
                  <Carousel
                    setApi={setExecApi}
                    opts={{ align: 'start', loop: true }}
                    plugins={[execAutoplay.current]}
                    className="size-full"
                  >
                    <CarouselContent>
                      {executives!.map((member) => (
                        <CarouselItem key={member.id} className="relative h-full">
                          <div className="relative aspect-square lg:aspect-auto lg:h-[280px]">
                            <SlideContent member={member} roleLabel={member.committeeRole || 'Executive'} />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                  {hasExecutives && executives!.length > 1 && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 lg:inline-flex"
                        onClick={() => execApi?.scrollPrev()}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 lg:inline-flex"
                        onClick={() => execApi?.scrollNext()}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <div className="p-8 text-primary-foreground">
                  <Rocket className="mb-6 h-10 w-10" />
                  <h3 className="mb-4 text-2xl font-semibold">
                    {aboutSettings.vision.title || 'Our Vision'}
                  </h3>
                  <p className="text-primary-foreground/80">{aboutSettings.vision.description}</p>
                  <Rocket className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10" />
                </div>
              )}
            </div>

            {/* Action Card */}
            <div className="flex flex-col justify-between gap-6 rounded-xl border p-7">
              <div>
                <p className="mb-2 text-lg font-semibold">
                  {aboutSettings.join.title || 'Ready to join us?'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {aboutSettings.join.description ||
                    'Become part of a community that is shaping the future of technology.'}
                </p>
              </div>
              <Button className="group w-full justify-between" asChild>
                <Link href="/register">
                  {aboutSettings.join.button || 'Get Started'}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Achievement/Secondary Vision */}
        <div className="mt-10 rounded-xl bg-muted p-8 md:p-16">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold md:text-3xl">
                {aboutSettings.vision.description2Title || 'A Future Built Together'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {aboutSettings.vision.description2}
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="text-center md:text-right">
                <span className="block text-5xl font-bold tracking-tighter md:text-7xl text-primary">
                  2030
                </span>
                <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">
                  Strategic Horizon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Marquee, MarqueeContent, MarqueeFade, MarqueeItem } from '@/components/kibo-ui/marquee'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AboutSettingsData } from '@/globals/types'
import type { AppLocale } from '@/lib/locale'
import memberImg from '@/../public/member.jpeg'
import Image from 'next/image'
import Link from 'next/link'

interface About3Props {
  className?: string
  aboutSettings: AboutSettingsData
  lang: AppLocale
}

export function About3({ className, aboutSettings, lang }: About3Props) {
  const title = aboutSettings.title
  const description = aboutSettings.description

  const [data, setData] = useState<{
    members: number
    projects: number
    achievements: number
    workshops: number
    sponsors: { name: string; website: string; logo: string }[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/public-stats')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(() => {})
  }, [])

  const mainImage = {
    src: memberImg,
    alt: 'Robotics Feature',
  }

  const secondaryImage = {
    src: 'https://images.unsplash.com/photo-1775019062004-6e1ca1e15d23?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'Robotics Workshop',
  }

  const achievements = [
    {
      label: aboutSettings.stats.achievement1Label || 'Members',
      value: data ? String(data.members) : aboutSettings.stats.achievement1Value || '0',
    },
    {
      label: aboutSettings.stats.achievement2Label || 'Projects',
      value: data ? String(data.projects) : aboutSettings.stats.achievement2Value || '0',
    },
    {
      label: aboutSettings.stats.achievement3Label || 'Awards',
      value: data ? String(data.achievements) : aboutSettings.stats.achievement3Value || '0',
    },
    {
      label: aboutSettings.stats.achievement4Label || 'Workshops',
      value: data ? String(data.workshops) : aboutSettings.stats.achievement4Value || '0',
    },
  ]

  const sponsors = data?.sponsors ?? []

  return (
    <section className={cn('py-10 md:py-20 px-4 mx-auto max-w-7xl', className)}>
      <div className="w-full">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-5 lg:w-2/3">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">{title}</h1>
          <p className="text-lg text-muted-foreground md:text-xl">{description}</p>
        </div>

        {/* Visual Grid */}
        <div className="grid gap-7 lg:grid-cols-3">
          <Image
            src={mainImage.src}
            alt={mainImage.alt}
            className="size-full max-h-[620px] rounded-xl object-cover lg:col-span-2"
          />

          <div className="flex flex-col gap-7 md:flex-row lg:flex-col">
            {/* Breakout Card */}
            <div className="flex flex-col justify-between gap-6 rounded-xl bg-muted p-7 md:w-1/2 lg:w-auto">
              <img
                src="https://ui-avatars.com/api/?name=DPIRC&background=6366f1&color=fff&size=128"
                alt="DPIRC Logo"
                className="mr-auto h-12 w-12 rounded-lg object-contain"
              />
              <div>
                <p className="mb-2 text-lg font-semibold">DPI Robotics Club</p>
                <p className="text-muted-foreground">
                  {aboutSettings.heroCard.description ||
                    'Empowering students with practical robotics knowledge.'}
                </p>
              </div>
              <Button variant="outline" className="mr-auto" asChild>
                <a href="/courses">{aboutSettings.heroCard.exploreCourses || 'Explore Courses'}</a>
              </Button>
            </div>

            <img
              src={secondaryImage.src}
              alt={secondaryImage.alt}
              className="grow basis-0 rounded-xl object-cover md:w-1/2 lg:min-h-0 lg:w-auto"
            />
          </div>
        </div>

        {/* --- FIXED MARQUEE SECTION --- */}
        {sponsors.length > 0 && (
          <div className="py-24">
            <div className="mb-8 text-center">
              <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                {aboutSettings.partners.title || 'Our Partners'}
              </h3>
            </div>
            <Marquee>
              <MarqueeContent speed={40}>
                {sponsors.map((sponsor, idx) => {
                  const logo = (
                    <Image
                      src={sponsor.logo}
                      alt={sponsor.name}
                      width={120}
                      height={40}
                      className="h-10 w-auto rounded-lg object-contain grayscale active:grayscale-0 hover:grayscale-0 transition-all"
                    />
                  )
                  return (
                    <MarqueeItem key={`${sponsor.name}-${idx}`} className="mx-8 flex items-center">
                      {sponsor.website ? (
                        <Link href={sponsor.website} target="_blank" rel="noopener noreferrer">
                          {logo}
                        </Link>
                      ) : (
                        logo
                      )}
                    </MarqueeItem>
                  )
                })}
              </MarqueeContent>
              <MarqueeFade side="left" />
              <MarqueeFade side="right" />
            </Marquee>
          </div>
        )}

        {/* Achievements Box */}
        <div className="relative overflow-hidden rounded-xl bg-muted p-7 md:p-16">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <h2 className="text-3xl font-medium md:text-4xl">
              {aboutSettings.achievements.title || 'Our Journey in Numbers'}
            </h2>
            <p className="max-w-xl text-muted-foreground">
              {aboutSettings.achievements.description ||
                'Growing together through technology and innovation.'}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:flex md:flex-wrap md:justify-between">
            {achievements.map((item, idx) => (
              <div className="flex flex-col gap-2 text-center md:text-left" key={idx}>
                <span className="font-mono text-4xl font-semibold md:text-5xl">{item.value}+</span>
                <p className="text-sm md:text-base">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission/Vision Sections */}
        <div className="mx-auto grid max-w-5xl gap-16 py-20 md:grid-cols-2">
          <div>
            <h2 className="mb-5 text-3xl font-medium">
              {aboutSettings.vision.title || 'Our Vision'}
            </h2>
            <p className="whitespace-pre-line text-lg leading-7 text-muted-foreground">
              {aboutSettings.vision.description}
            </p>
          </div>
          <div>
            <h2 className="mb-5 text-3xl font-medium">
              {aboutSettings.mission.title || 'Our Mission'}
            </h2>
            <p className="whitespace-pre-line text-lg leading-7 text-muted-foreground">
              {aboutSettings.mission.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// components/about/about-hero.tsx

'use client'

import { Cpu, Sparkles, Users2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { AboutSettingsData } from '@/globals/types'
import type { AppLocale } from '@/lib/locale'

export function AboutHero({ aboutSettings, lang }: { aboutSettings: AboutSettingsData; lang: AppLocale }) {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-12 md:pt-24 md:pb-20 lg:pt-32 lg:pb-24">
      {/* Background Decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="text-center">
          <Badge
            className="mb-6 px-3 py-1 text-sm font-medium tracking-wide uppercase"
            variant="outline"
          >
            {aboutSettings.badge}
          </Badge>

          <h1 className="mb-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              {aboutSettings.title}
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            {aboutSettings.description}
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: aboutSettings.innovation.title,
              description: aboutSettings.innovation.description,
            },
            {
              icon: Users2,
              title: aboutSettings.collaboration.title,
              description: aboutSettings.collaboration.description,
            },
            {
              icon: Cpu,
              title: aboutSettings.technical.title,
              description: aboutSettings.technical.description,
            },
          ].map((item, idx) => (
            <Card
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <item.icon className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-bold tracking-tight">{item.title}</h3>

              <p className="mt-3 leading-relaxed text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

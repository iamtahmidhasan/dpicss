'use client'

import { motion } from 'framer-motion'
import { Award, CircuitBoard, Cpu, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'
import Link from 'next/link'

type ProgramsSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  className?: string
}

export default function ProgramsSection({ lang, homeSettings, className }: ProgramsSectionProps) {
  const features = homeSettings.features
  const programs = [
    { icon: Cpu, group: features?.workshops, color: 'bg-cat-blue/10 text-cat-blue' },
    { icon: CircuitBoard, group: features?.buildNight, color: 'bg-cat-violet/10 text-cat-violet' },
    { icon: Award, group: features?.competition, color: 'bg-cat-amber/10 text-cat-amber' },
    { icon: ShieldCheck, group: features?.mentorship, color: 'bg-cat-emerald/10 text-cat-emerald' },
  ]

  return (
    <section className={cn('px-4 py-10 mx-auto max-w-7xl md:py-10', className)}>
      <div className="w-full">
        <div className="mb-16 flex flex-col gap-5 lg:w-2/3">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {localizedField(features?.title, lang)}
          </h2>
          <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
            {localizedField(features?.subtitle, lang)}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl bg-muted p-8 lg:col-span-2 lg:row-span-2 min-h-[400px]"
          >
            <div className="absolute inset-0 z-0">
              <img
                src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80"
                alt="Workshop"
                className="h-full w-full object-cover opacity-30 grayscale transition-all duration-500 group-hover:scale-105 group-active:scale-105 group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            <div className="relative z-10">
              <div
                className={cn(
                  'mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
                  programs[0].color,
                )}
              >
                <Cpu className="size-7" />
              </div>
              <h3 className="text-3xl font-semibold mb-4">{localizedField(programs[0].group?.title, lang)}</h3>
              <p className="max-w-md text-muted-foreground text-lg mb-6">
                {localizedField(programs[0].group?.description, lang)}
              </p>
              <Link href="/events">
                <div className="flex items-center gap-2 text-primary font-medium">
                  Learn more <ArrowUpRight className="size-4" />
                </div>
              </Link>
            </div>
          </motion.div>

          {programs.slice(1).map((program, idx) => {
            const Icon = program.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:bg-muted/50 active:scale-95 active:bg-muted/50"
              >
                <div>
                  <div
                    className={cn(
                      'mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl',
                      program.color,
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{localizedField(program.group?.title, lang)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {localizedField(program.group?.description, lang)}
                  </p>
                </div>

                <span className="absolute -bottom-4 -right-2 text-8xl font-bold opacity-[0.03] select-none">
                  0{idx + 2}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

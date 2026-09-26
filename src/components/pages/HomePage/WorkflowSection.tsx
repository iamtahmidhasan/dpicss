'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AppLocale } from '@/lib/locale'
import type { HomeSettingsData } from '@/globals/types'
import { localizedField } from '@/lib/localized-string'

type WorkflowSectionProps = {
  lang: AppLocale
  homeSettings: HomeSettingsData
  className?: string
}

export default function WorkflowSection({ lang, homeSettings, className }: WorkflowSectionProps) {
  const workflow = homeSettings.workflow
  const steps = [
    workflow?.step1,
    workflow?.step2,
    workflow?.step3,
  ]

  return (
    <section className={cn('px-4 py-20 mx-auto max-w-7xl md:py-32', className)}>
      <div className="grid gap-16 lg:grid-cols-3 lg:items-start">
        {/* Left Column: Sticky Header - Standard About3 Alignment */}
        <div className="lg:sticky lg:top-32 space-y-6">
          <Badge className="px-4 py-1.5 text-sm font-medium" variant="secondary">
            {localizedField(workflow?.badge, lang) || 'How it works'}
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            {localizedField(workflow?.title, lang)}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {localizedField(workflow?.description, lang)}
          </p>

          {/* Decorative element to fill space, matching About3 visual depth */}
          <div className="hidden lg:block pt-10">
            <div className="h-px w-full bg-gradient-to-r from-border to-transparent" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
              Robotics Lifecycle
            </p>
          </div>
        </div>

        {/* Right Column: High-End Step Progress (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative grid grid-cols-1 gap-6 rounded-[2.5rem] border border-border/50 bg-muted/40 p-8 md:grid-cols-[120px_1fr] md:p-12 transition-colors hover:bg-muted"
            >
              {/* Step Numbering - Modern Tech Aesthetic */}
              <div className="flex flex-col items-center justify-center border-b border-border/50 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-10">
                <span className="text-sm font-bold text-primary mb-2">Phase 0{index + 1}</span>
                <span className="font-mono text-5xl font-light tracking-tighter text-foreground/20 group-hover:text-primary/40 transition-colors">
                  0{index + 1}
                </span>
              </div>

              {/* Content Section */}
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {localizedField(step?.title, lang)}
                </h3>
                <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl">
                  {localizedField(step?.description, lang)}
                </p>

                {/* Visual "Line" Connector (Matches Kibo UI vibes) */}
                {index !== steps.length - 1 && (
                  <div className="hidden md:block absolute -bottom-8 left-[60px] h-8 w-px bg-gradient-to-b from-primary/30 to-transparent" />
                )}
              </div>

              {/* Decorative Arrow or Icon on Hover */}
              <div className="absolute top-8 right-8 opacity-0 transition-opacity group-hover:opacity-100 hidden md:block">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                  <span className="text-primary">→</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

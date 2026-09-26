import type { Metadata } from 'next'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import type { SponsorsSettingsData } from '@/globals/types'

export const metadata: Metadata = {
  title: 'Our Partners & Sponsors',
  description: 'Meet the organizations that support DPI Robotics Club in our mission to inspire innovation and learning.',
}

type SponsorCard = {
  id: string
  name?: unknown
  logo?: { url?: string } | null
  website?: string
}

export default async function SponsorsPage() {
  const payload = await getPayloadWithRetry()
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)
  const settings = await getGlobalPayload<SponsorsSettingsData>('sponsors-settings', locale)

  const result = await payload.find({
    collection: 'sponsors' as any,
    where: { status: { equals: 'published' } },
    sort: 'createdAt',
    limit: 100,
    depth: 1,
    overrideAccess: true,
    ...locOpts,
  })

  const docs = result.docs as SponsorCard[]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">{settings.title}</h1>
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground">{settings.subtitle}</p>
      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          {settings.empty}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {docs.map((item) => {
            const name = pickLocalizedString(item.name, locale) || settings.untitled

            const card = (
              <div className="group">
                {item.logo?.url ? (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={item.logo.url}
                      alt={name}
                      className="w-full object-cover transition-opacity duration-200 group-hover:opacity-80"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-muted">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {name?.charAt(0)}
                    </span>
                  </div>
                )}
                <p className="mt-2 text-center text-sm font-medium">{name}</p>
              </div>
            )

            if (item.website) {
              return (
                <a
                  key={item.id}
                  href={item.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {card}
                </a>
              )
            }

            return <div key={item.id}>{card}</div>
          })}
        </div>
      )}
    </main>
  )
}

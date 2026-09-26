import Link from 'next/link'
import { type Where } from 'payload'
import { Package, ShoppingBag, Star } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/payload-auth'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { pickLocalizedString } from '@/lib/localized-string'
import { getGlobalPayload } from '@/lib/payload-globals'
import { getCache, setCache } from '@/lib/cache/redis'
import {
  buildWhatsAppUrl,
  mediaUrl,
  priceFromDualPricing,
  type ShopItem,
} from '@/lib/courses/course-helpers'
import { cn } from '@/lib/utils'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import type { ShopSettingsData, CoursesSettingsData } from '@/globals/types'

type SearchParams = Promise<{ sort?: string }>
type CachedShopItems = { docs: unknown[] }

const SHOP_CACHE_TTL_SECONDS = Number(process.env.REDIS_SHOP_CACHE_TTL_SECONDS || 180)

function categoryLabel(map: Record<string, string> | undefined, key: string | undefined, fallback: string): string {
  const k = key || ''
  return map?.[k] || fallback
}

function stockLabel(map: Record<string, string> | undefined, key: string): string {
  return map?.[key] || key
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const { sort = 'latest' } = await searchParams
  const popular = sort === 'popular'

  const payload = await getPayloadWithRetry()
  const user = await getCurrentUser()
  const isOfficialViewer = user?.memberCategory === 'official'
  const locale = await getRequestLocale()
  const locOpts = payloadLocaleOptions(locale)

  const [shopSettings, coursesSettings] = await Promise.all([
    getGlobalPayload<ShopSettingsData>('shop-settings', locale),
    getGlobalPayload<CoursesSettingsData>('courses-settings', locale),
  ])

  const where: Where = isOfficialViewer
    ? { status: { equals: 'published' } }
    : {
        and: [
          { status: { equals: 'published' } },
          {
            or: [{ memberType: { equals: 'unofficial' } }, { memberType: { equals: 'both' } }],
          },
        ],
      }

  const cacheKey = [
    'shop',
    locale,
    popular ? 'popular' : 'latest',
    isOfficialViewer ? 'official' : 'unofficial',
  ].join(':')

  const cached = await getCache<CachedShopItems>(cacheKey)
  const items =
    cached?.docs ??
    (
      await payload.find({
        collection: 'shop',
        where,
        sort: popular ? '-sortOrder' : '-createdAt',
        depth: 1,
        limit: 60,
        ...locOpts,
      })
    ).docs

  if (!cached) {
    await setCache(cacheKey, { docs: items }, SHOP_CACHE_TTL_SECONDS)
  }

  const memberCategory = user?.memberCategory === 'official' ? 'official' : 'unofficial'

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{shopSettings.title}</h1>
          <p className="mt-1 text-muted-foreground">{shopSettings.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={!popular ? 'default' : 'outline'} size="sm">
            <Link href="/shop?sort=latest">{shopSettings.sortLatest}</Link>
          </Button>
          <Button asChild variant={popular ? 'default' : 'outline'} size="sm">
            <Link href="/shop?sort=popular">{shopSettings.sortFeatured}</Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {shopSettings.empty}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((raw: unknown) => {
            const item = raw as unknown as ShopItem
            const thumb = mediaUrl(item.featuredImage)
            const price = priceFromDualPricing(item.pricing, memberCategory)
            const currency = item.pricing?.currency === 'USD' ? '$' : '৳'
            const stock = item.stockStatus || 'in_stock'
            const titleForContact =
              pickLocalizedString(item.title as unknown, locale) || 'this item'
            const waUrl = buildWhatsAppUrl(
              item.purchaseContact?.whatsappNumber,
              titleForContact,
              item.purchaseContact?.whatsappMessage,
            )
            const canBuy = stock !== 'sold_out' && Boolean(waUrl)

            return (
              <Card
                key={item.id}
                className="flex flex-col overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-video bg-muted">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : null}
                  <Badge className="absolute right-2 top-2 capitalize" variant="secondary">
                    {stockLabel(undefined, stock)}
                  </Badge>
                </div>
                <CardHeader className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {categoryLabel(undefined, item.productCategory, shopSettings.categoryFallback)}
                    </Badge>
                    <span className="ml-auto flex items-center gap-1 text-sm text-amber-600">
                      <Star className="size-4 fill-current" />
                      {item.isFeatured ? '★' : '—'}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-2 text-lg leading-snug">
                    {pickLocalizedString(item.title as unknown, locale) || item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3 p-4 pt-0">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {pickLocalizedString(item.shortDescription as unknown, locale) ??
                      item.shortDescription}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="size-3.5" />
                      {shopSettings.clubShop}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="size-3.5" />
                      {stockLabel(undefined, stock)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/30 p-4">
                  <div className="text-lg font-semibold">
                    {price <= 0 ? (
                      coursesSettings.free
                    ) : (
                      <span>
                        {currency}
                        {price}
                      </span>
                    )}
                  </div>
                  {canBuy ? (
                    <Button asChild className={cn('shrink-0')}>
                      <a href={waUrl!} target="_blank" rel="noopener noreferrer">
                        {shopSettings.buyNow}
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" disabled className="shrink-0">
                      {stock === 'sold_out'
                        ? shopSettings.soldOut
                        : shopSettings.unavailable}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

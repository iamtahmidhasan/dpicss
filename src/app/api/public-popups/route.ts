import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-user, x-locale',
}

function extractLocalized(value: unknown, locale: string): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    if (locale in obj) {
      const localeValue = obj[locale]
      return typeof localeValue === 'string' ? localeValue : ''
    }
    if ('en' in obj) {
      const enValue = obj['en']
      return typeof enValue === 'string' ? enValue : ''
    }
  }
  return ''
}

function extractImageUrl(image: unknown): string {
  if (!image || typeof image !== 'object') return ''
  const img = image as Record<string, unknown>
  if ('url' in img && typeof img.url === 'string') return img.url
  if ('filename' in img) {
    const filename = img.filename
    if (typeof filename === 'string' && filename.startsWith('http')) return filename
  }
  return ''
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path') || '/'
    const locale = searchParams.get('locale') || req.headers.get('x-locale') || 'en'
    const user = req.headers.get('x-user') ? JSON.parse(req.headers.get('x-user')!) : null

    const userRoles = user?.roles || []
    const isAuthenticated = Boolean(user)
    const isMember = userRoles.includes('member') || userRoles.includes('admin')
    const isAdmin = userRoles.includes('admin')

    const now = new Date().toISOString()

    const popups = await payload.find({
      collection: 'popups' as any,
      where: {
        and: [
          { status: { equals: 'published' } },
          {
            or: [
              { 'schedule.enableSchedule': { equals: false } },
              {
                and: [
                  { 'schedule.enableSchedule': { equals: true } },
                  { 'schedule.startDate': { less_than_equal: now } },
                  { 'schedule.endDate': { greater_than_equal: now } },
                ],
              },
            ],
          },
        ],
      },
      sort: '-priority',
      limit: 10,
      depth: 1,
      overrideAccess: true,
    })

    const filteredPopups = popups.docs.filter((popup: Record<string, unknown>) => {
      const targeting = popup.targeting as Record<string, unknown> | undefined
      if (!targeting) return true

      const pageRule = (targeting.pageRule as string) || 'all'

      if (pageRule !== 'all') {
        const isHomepage = path === '/' || path === ''
        const normalizedPath = path.startsWith('/') ? path : `/${path}`
        const popupPages = ((targeting.specificPages as Array<Record<string, unknown>>) || [])
          .map((p) => p.path as string)
          .filter(Boolean)

        switch (pageRule) {
          case 'homepage':
            if (!isHomepage) return false
            break
          case 'inner':
            if (isHomepage) return false
            break
          case 'specific':
            if (popupPages.length > 0) {
              const hasMatch = popupPages.some(
                (page) =>
                  normalizedPath === page ||
                  normalizedPath.startsWith(page + '/') ||
                  page === '*',
              )
              if (!hasMatch) return false
            }
            break
          case 'except':
            if (popupPages.length > 0) {
              const hasMatch = popupPages.some(
                (page) =>
                  normalizedPath === page ||
                  normalizedPath.startsWith(page + '/') ||
                  page === '*',
              )
              if (hasMatch) return false
            }
            break
        }
      }

      const roleRule = (targeting.userRoles as string) || 'all'
      if (roleRule !== 'all') {
        switch (roleRule) {
          case 'guest':
            if (isAuthenticated) return false
            break
          case 'authenticated':
            if (!isAuthenticated) return false
            break
          case 'member':
            if (!isMember) return false
            break
          case 'admin':
            if (!isAdmin) return false
            break
        }
      }

      return true
    })

    const localizedPopups = filteredPopups.map((popup: Record<string, unknown>) => {
      const imageMobileAlt = extractLocalized(popup.imageMobileAlt, locale)
      const imageDesktopAlt = extractLocalized(popup.imageDesktopAlt, locale)
      const imageMobileUrl = extractImageUrl(popup.imageMobile)
      const imageDesktopUrl = extractImageUrl(popup.imageDesktop)

      const linkGroup = popup.link as Record<string, unknown> | undefined

      return {
        id: popup.id,
        imageMobileUrl,
        imageMobileAlt,
        imageDesktopUrl,
        imageDesktopAlt,
        link: {
          enabled: linkGroup?.enabled || false,
          url: linkGroup?.url || '',
          openInNewTab: linkGroup?.openInNewTab || false,
        },
        displaySettings: popup.displaySettings,
        locale,
      }
    })

    return NextResponse.json({ popups: localizedPopups }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Popups API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch popups' }, { status: 500 })
  }
}

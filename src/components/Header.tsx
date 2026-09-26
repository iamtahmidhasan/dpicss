import { headers as getHeaders } from 'next/headers.js'
import { cookies } from 'next/headers'
import { getPayloadWithRetry } from '@/lib/payload-safe'

import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { getMessages } from '@/messages'
import { pickLocalizedString } from '@/lib/localized-string'
import { HeaderClient } from '@/components/HeaderClient'
import type { User } from '@/payload-types'

type MenuItem = {
  label?: string
  href?: string
  children?: Array<{ label?: string; href?: string; description?: string }>
}

type BannerSettings = {
  enabled?: boolean
  text?: string | Record<string, unknown>
  link?: string
  backgroundColor?: string
  customBackgroundColor?: string
  textColor?: string
}

type HeaderGlobal = {
  siteTitle?: string
  showSearch?: boolean
  logo?: { url?: string } | string | null
  menuItems?: MenuItem[] | null
  languages?: Array<{ label?: string; code: string }> | null
  banner?: BannerSettings | null
}

export default async function Header() {
  const headers = await getHeaders()
  const cookieStore = await cookies()
  const locale = await getRequestLocale()
  const messages = getMessages(locale)
  const locOpts = payloadLocaleOptions(locale)
  let settings: HeaderGlobal = {}
  let user: User | null = null
  let profileAvatar = ''
  let googlePicture: string | undefined

  try {
    const payloadConfig = await config
    const payload = await getPayloadWithRetry()

    try {
      const authResult = await payload.auth({ headers })
      user = (authResult.user as User | null) ?? null
    } catch {
      user = null
    }

    try {
      settings = (await payload.findGlobal({
        slug: 'header-settings',
        depth: 1,
        overrideAccess: true,
        ...locOpts,
        select: {
          siteTitle: true,
          showSearch: true,
          logo: true,
          menuItems: true,
          languages: true,
          banner: true,
        },
      })) as HeaderGlobal
    } catch {
      settings = {}
    }

    if (user) {
      try {
        if (user.memberCategory === 'official' && user.officialMemberProfile) {
          const id =
            typeof user.officialMemberProfile === 'object'
              ? user.officialMemberProfile.id
              : user.officialMemberProfile
          if (id) {
            const profile = await payload.findByID({
              collection: 'members',
              id: String(id),
              depth: 1,
              user,
              overrideAccess: false,
              select: { avatar: true },
            })
            if (profile?.avatar && typeof profile.avatar === 'object') {
              profileAvatar = String(profile.avatar.url || '')
            }
          }
        } else if (user.memberCategory === 'unofficial' && user.unofficialMemberProfile) {
          const id =
            typeof user.unofficialMemberProfile === 'object'
              ? user.unofficialMemberProfile.id
              : user.unofficialMemberProfile
          if (id) {
            const profile = await payload.findByID({
              collection: 'unofficial-members',
              id: String(id),
              depth: 1,
              user,
              overrideAccess: false,
              select: { avatar: true },
            })
            if (profile?.avatar && typeof profile.avatar === 'object') {
              profileAvatar = String(profile.avatar.url || '')
            }
          }
        }
        const userDoc = await payload.findByID({
          collection: 'users',
          id: String(user.id),
          depth: 0,
          user,
          overrideAccess: false,
          select: { googlePicture: true },
        })
        googlePicture = typeof userDoc?.googlePicture === 'string' ? userDoc.googlePicture : undefined
      } catch {
        profileAvatar = ''
        googlePicture = undefined
      }
    }
  } catch {
    settings = {}
    user = null
    profileAvatar = ''
    googlePicture = undefined
  }

  const menuItems = settings.menuItems?.filter((item) => item?.label && item?.href) || [
    { label: 'Home', href: '/' },
    { label: 'Courses', href: '/courses' },
    { label: 'Events', href: '/events' },
    { label: 'Teams', href: '/teams' },
    { label: 'Achievements', href: '/achievements' },
    { label: 'Sponsors', href: '/sponsors' },
    { label: 'Contact', href: '/contact' },
    { label: 'Shop', href: '/shop' },
    { label: 'Posts', href: '/posts' },
    { label: 'Members', href: '/members' },
  ]

  const languages = settings.languages?.filter((lng) => lng?.label) || [
    { label: 'English', code: 'en' },
  ]
  const siteTitle = pickLocalizedString(settings.siteTitle as unknown, locale) || 'DPICS'
  const logoURL =
    settings.logo && typeof settings.logo === 'object' ? String(settings.logo.url || '') : ''
  const siteTagline = 'Where Technology Meets Creativity'

  const bannerEnabled = settings.banner?.enabled || false
  const bannerText = bannerEnabled
    ? pickLocalizedString(settings.banner?.text as unknown, locale) || ''
    : ''
  const bannerLink = settings.banner?.link || ''
  const bannerBgColor =
    settings.banner?.backgroundColor === 'custom'
      ? settings.banner?.customBackgroundColor || '#000'
      : settings.banner?.backgroundColor || 'bg-primary'
  const bannerTextColor = settings.banner?.textColor || 'text-white'

  const fallbackAvatar = user
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=111827&color=fff`
    : ''
  const preferredLanguageCode = cookieStore.get('dpirc-lang')?.value
  const selectedLanguage =
    languages.find(
      (lang) => String(lang.code || '').toLowerCase() === preferredLanguageCode?.toLowerCase(),
    ) || languages[0]

  const bannerData = bannerEnabled
    ? {
        text: bannerText,
        link: bannerLink,
        backgroundColor: bannerBgColor,
        textColor: bannerTextColor,
      }
    : null

  return (
    <HeaderClient
      siteTitle={siteTitle}
      logoURL={logoURL}
      siteTagline={siteTagline}
      menuItems={menuItems}
      languages={languages}
      messages={messages}
      showSearch={settings.showSearch !== false}
      user={user ? { email: user.email, memberCategory: user.memberCategory || undefined } : null}
      profileAvatar={profileAvatar || googlePicture || ''}
      fallbackAvatar={fallbackAvatar}
      selectedLanguageLabel={selectedLanguage?.label}
      banner={bannerData}
    />
  )
}

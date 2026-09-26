import Link from 'next/link'
import Image from 'next/image'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import config from '@/payload.config'
import { getRequestLocale, payloadLocaleOptions } from '@/lib/i18n-server'
import { getMessages, t } from '@/messages'
import { pickLocalizedString } from '@/lib/localized-string'
import { ArrowRight } from 'lucide-react'

type SocialPlatform = {
  platform: string
  url: string
}

const socialIcons: Record<string, { label: string; svg: string }> = {
  'facebook-page': {
    label: 'Facebook',
    svg: 'M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.384C19.612 22.954 24 17.99 24 12z',
  },
  'facebook-group': {
    label: 'Facebook Group',
    svg: 'M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.47h-2.796v8.384C19.612 22.954 24 17.99 24 12z',
  },
  instagram: {
    label: 'Instagram',
    svg: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  },
  youtube: {
    label: 'YouTube',
    svg: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
  linkedin: {
    label: 'LinkedIn',
    svg: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
  twitter: {
    label: 'X (Twitter)',
    svg: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  github: {
    label: 'GitHub',
    svg: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
  discord: {
    label: 'Discord',
    svg: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z',
  },
  telegram: {
    label: 'Telegram',
    svg: 'M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
  },
}

type FooterLink = {
  label?: string
  href?: string
}

type FooterColumn = {
  title?: string
  links?: FooterLink[]
}

type FooterGlobal = {
  companyName?: string
  description?: string
  footerLogo?: { url?: string } | string | null
  contactEmail?: string
  contactPhone?: string
  officeAddress?: string
  columns?: FooterColumn[] | null
  legalLinks?: FooterLink[] | null
  copyrightText?: string
  socialLinks?: { platform: string; url: string }[] | null
}

export default async function Footer() {
  const locale = await getRequestLocale()
  const messages = getMessages(locale)
  const locOpts = payloadLocaleOptions(locale)
  let settings: FooterGlobal = {}

  try {
    const payloadConfig = await config
    const payload = await getPayloadWithRetry()

    try {
      settings = (await payload.findGlobal({
        slug: 'footer-settings',
        depth: 1,
        overrideAccess: true,
        ...locOpts,
        select: {
          companyName: true,
          description: true,
          footerLogo: true,
          contactEmail: true,
          contactPhone: true,
          officeAddress: true,
          columns: true,
          legalLinks: true,
          copyrightText: true,
          socialLinks: true,
        },
      })) as FooterGlobal
    } catch {
      settings = {}
    }
  } catch {
    settings = {}
  }

  const columns = settings.columns?.filter((column) => column?.title && column.links?.length) || []
  const legalLinks = settings.legalLinks?.filter((link) => link?.label && link?.href) || []
  const companyName = pickLocalizedString(settings.companyName as unknown, locale) || 'DPIRC'
  const description =
    pickLocalizedString(settings.description as unknown, locale) ||
    'Connecting learners and educators with a modern dashboard experience.'
  const footerLogoURL =
    settings.footerLogo && typeof settings.footerLogo === 'object'
      ? String(settings.footerLogo.url || '')
      : ''
  const copyrightText =
    pickLocalizedString(settings.copyrightText as unknown, locale) ||
    `© ${new Date().getFullYear()} ${companyName}. ${t(messages, 'footer.rights')}`
  const socialLinks = settings.socialLinks?.filter((link) => link?.platform && link?.url) || []

  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              {footerLogoURL ? (
                <img
                  src={footerLogoURL}
                  alt={companyName}
                  className="h-10 w-auto rounded-md object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-sm font-semibold text-white">
                  {companyName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-white">{companyName}</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300">{description}</p>
            <div className="space-y-2 text-sm text-slate-400">
              {settings.officeAddress ? <p>{settings.officeAddress}</p> : null}
              {settings.contactEmail ? (
                <p>
                  {t(messages, 'footer.email')}{' '}
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-slate-200 hover:text-white"
                  >
                    {settings.contactEmail}
                  </a>
                </p>
              ) : null}
              {settings.contactPhone ? (
                <p>
                  {t(messages, 'footer.phone')} {settings.contactPhone}
                </p>
              ) : null}
            </div>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3 pt-1">
                {socialLinks.map((link, idx) => {
                  const icon = socialIcons[link.platform]
                  if (!icon) return null
                  return (
                    <a
                      key={`${link.platform}-${idx}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                      aria-label={icon.label}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d={icon.svg} />
                      </svg>
                    </a>
                  )
                })}
              </div>
            )}
            <a
              href="https://www.dianahost.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="items-center hidden md:inline-flex  gap-2 rounded-md bg-slate-800/50 px-3 py-1.5 transition-colors hover:bg-slate-800"
            >
              <span className="text-xs text-slate-400">Hosted on</span>
              <Image
                src="/logo/dianahost.png"
                alt="DianaHost"
                width={300}
                height={100}
                className="h-[50px] w-auto"
              />
            </a>
          </div>

          {columns.map((column, columnIndex) => (
            <div key={`${column.title}-${columnIndex}`}>
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                {column.title}
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                {column.links?.map((link, linkIndex) => (
                  <li key={`${link.href}-${linkIndex}`}>
                    {link?.href ? (
                      <Link
                        href={String(link.href)}
                        className="transition-colors flex items-center gap-2 hover:text-white"
                      >
                        <ArrowRight className="h-4 w-4" />
                        {link.label || link.href}
                      </Link>
                    ) : (
                      <span>{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 sm:flex sm:items-center sm:justify-between">
          <div className="flex flex-col items-start space-y-2 text-sm text-slate-500">
            <p className="text-sm text-slate-500">
              © 2025 - {new Date().getFullYear()} DPI Robotics Club. All rights reserved.
            </p>
            <p>
              {' '}
              Developed by
              <a
                href="https://www.tahmidhasan.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white"
              >
                {' '}
                Tahmid Hasan
              </a>
              .
            </p>
            <a
              href="https://www.dianahost.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center md:hidden gap-2 rounded-md bg-slate-800/50 px-3 py-1.5 transition-colors hover:bg-slate-800"
            >
              <span className="text-xs text-slate-400">Hosted on</span>
              <Image
                src="/logo/dianahost.png"
                alt="DianaHost"
                width={300}
                height={100}
                className="h-[50px] w-auto"
              />
            </a>
          </div>
          {legalLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300 sm:mt-0">
              {legalLinks.map((link, linkIndex) => (
                <Link
                  key={`${link.href}-${linkIndex}`}
                  href={String(link.href)}
                  className="transition-colors hover:text-white"
                >
                  {link.label || link.href}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="h-14 md:hidden"></div>
    </footer>
  )
}

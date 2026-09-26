import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, normalizeLocale, type AppLocale } from '@/lib/locale'

export async function getRequestLocale(): Promise<AppLocale> {
  const jar = await cookies()
  return normalizeLocale(jar.get(LOCALE_COOKIE)?.value)
}

/** Payload Local API: active locale with English fallback for missing Bangla strings. */
export function payloadLocaleOptions(locale: AppLocale): {
  locale: AppLocale
  fallbackLocale: typeof DEFAULT_LOCALE
} {
  return {
    locale,
    fallbackLocale: DEFAULT_LOCALE,
  }
}

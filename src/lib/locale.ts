/** Cookie set by middleware when user picks a language (?lang=). */
export const LOCALE_COOKIE = 'dpirc-lang'

export const DEFAULT_LOCALE = 'en'
export const SUPPORTED_LOCALES = ['en', 'bn'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === 'en' || value === 'bn'
}

/** Normalize query param / cookie values to supported locales. */
export function normalizeLocale(raw: string | undefined | null): AppLocale {
  const c = String(raw || '')
    .trim()
    .toLowerCase()
  if (c === 'bn' || c === 'bd' || c === 'bangla' || c === 'bn-bd') return 'bn'
  return 'en'
}

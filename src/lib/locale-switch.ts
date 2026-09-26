/**
 * Build language switch URL while preserving existing query parameters.
 * This ensures switching language doesn't lose search queries, sort params, etc.
 */
export function buildLanguageSwitchUrl(
  pathname: string,
  searchParams: URLSearchParams,
  newLangCode: string,
): string {
  const params = new URLSearchParams(searchParams.toString())
  params.set('lang', newLangCode)
  return `${pathname}?${params.toString()}`
}

/**
 * Extract language code from URL or return default.
 */
export function getLanguageFromSearchParams(searchParams: URLSearchParams | null): string | null {
  return searchParams?.get('lang') || null
}

import { getPayloadWithRetry } from '@/lib/payload-safe'
import type { AppLocale } from '@/lib/locale'

/**
 * Fetch a Payload global by slug.
 * When `locale` is provided, localized fields resolve to plain strings.
 */
export async function getGlobalPayload<T>(
  slug: string,
  locale?: AppLocale,
): Promise<T> {
  const payload = await getPayloadWithRetry()
  return payload.findGlobal({
    slug: slug as any,
    depth: 0,
    ...(locale ? { locale } : {}),
  }) as Promise<T>
}

export { localizedField } from '@/lib/localized-string'

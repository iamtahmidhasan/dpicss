/**
 * When Payload localization is enabled, `title` may be a string (legacy) or `{ en, bn }`.
 * Slug hooks and utilities use the default locale string.
 */
export function pickLocalizedString(value: unknown, preferred: 'en' | 'bn' = 'en'): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const o = value as Record<string, string>
    const primary = o[preferred]
    if (typeof primary === 'string' && primary.trim()) return primary
    const en = o.en
    if (typeof en === 'string' && en.trim()) return en
    const bn = o.bn
    if (typeof bn === 'string' && bn.trim()) return bn
    const first = Object.values(o).find((v) => typeof v === 'string' && v.trim())
    if (typeof first === 'string') return first
  }
  return ''
}

/**
 * Extract a localized string from a Payload field value.
 * Handles both string values and `{ en, bn }` object shapes.
 * Client-safe (no Payload imports).
 */
export function localizedField(value: unknown, preferred: 'en' | 'bn' = 'en'): string {
  return pickLocalizedString(value, preferred)
}

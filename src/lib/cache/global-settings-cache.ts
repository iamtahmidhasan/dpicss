import { Payload } from 'payload'
import { AppLocale } from '@/lib/locale'

/**
 * In-memory per-request cache for global settings to avoid duplicate queries.
 * This cache is stored in req.context to persist across the same request lifecycle.
 */
const CACHE_KEY_HEADER = 'global:header-settings'
const CACHE_KEY_FOOTER = 'global:footer-settings'
const CACHE_KEY_REGISTRATION = 'global:registration-settings'

export async function getCachedHeaderSettings(
  payload: Payload,
  locale: AppLocale,
  req?: any,
): Promise<any> {
  // Check request-level cache first
  if (req?.context?.[CACHE_KEY_HEADER]) {
    return req.context[CACHE_KEY_HEADER]
  }

  try {
    const settings = await payload.findGlobal({
      slug: 'header-settings',
      depth: 1, // Reduced from 2: relationship depth can be minimal
      overrideAccess: true,
      locale,
      fallbackLocale: 'en',
    })

    // Store in request context for reuse during this request
    if (req?.context) {
      req.context[CACHE_KEY_HEADER] = settings
    }

    return settings
  } catch {
    return {}
  }
}

export async function getCachedFooterSettings(
  payload: Payload,
  locale: AppLocale,
  req?: any,
): Promise<any> {
  // Check request-level cache first
  if (req?.context?.[CACHE_KEY_FOOTER]) {
    return req.context[CACHE_KEY_FOOTER]
  }

  try {
    const settings = await payload.findGlobal({
      slug: 'footer-settings',
      depth: 1, // Reduced from 2
      overrideAccess: true,
      locale,
      fallbackLocale: 'en',
    })

    // Store in request context for reuse during this request
    if (req?.context) {
      req.context[CACHE_KEY_FOOTER] = settings
    }

    return settings
  } catch {
    return {}
  }
}

export async function getCachedRegistrationSettings(
  payload: Payload,
  req?: any,
): Promise<{ registrationEnabled: boolean; lockedMessage: string; allowOfficialRegistration: boolean; allowUnofficialRegistration: boolean }> {
  if (req?.context?.[CACHE_KEY_REGISTRATION]) {
    return req.context[CACHE_KEY_REGISTRATION]
  }

  try {
    const settings = await payload.findGlobal({
      slug: 'registration-settings' as any,
      depth: 0,
      overrideAccess: true,
    })

    const result = {
      registrationEnabled: settings.registrationEnabled ?? true,
      lockedMessage: settings.lockedMessage || 'Registration is currently disabled. Please contact the administrator for access.',
      allowOfficialRegistration: settings.allowOfficialRegistration ?? true,
      allowUnofficialRegistration: settings.allowUnofficialRegistration ?? true,
    }

    if (req?.context) {
      req.context[CACHE_KEY_REGISTRATION] = result
    }

    return result
  } catch {
    return {
      registrationEnabled: true,
      lockedMessage: 'Registration is currently disabled. Please contact the administrator for access.',
      allowOfficialRegistration: true,
      allowUnofficialRegistration: true,
    }
  }
}

import type { AppLocale } from '@/lib/locale'
import en from './en.json'
import bn from './bn.json'

export type Messages = typeof en

const bundles: Record<AppLocale, Messages> = {
  en: en as Messages,
  bn: bn as Messages,
}

export function getMessages(locale: AppLocale): Messages {
  return bundles[locale] ?? bundles.en
}

export function tArray(messages: Messages, path: string): string[] {
  const parts = path.split('.')
  let cur: unknown = messages
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      cur = bundles.en
      let engCur: unknown = cur
      for (const engP of parts) {
        if (engCur && typeof engCur === 'object' && engP in (engCur as object)) {
          engCur = (engCur as Record<string, unknown>)[engP]
        } else {
          return [path]
        }
      }
      cur = engCur
      break
    }
  }
  return Array.isArray(cur) ? cur : typeof cur === 'string' ? [cur] : [path]
}

/** Dot-path lookup, e.g. `header.login`. Falls back to English, then key if missing. */
export function t(messages: Messages, path: string, vars?: Record<string, string>): string {
  const parts = path.split('.')

  let cur: unknown = messages
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      cur = bundles.en
      let engCur: unknown = cur
      for (const engP of parts) {
        if (engCur && typeof engCur === 'object' && engP in (engCur as object)) {
          engCur = (engCur as Record<string, unknown>)[engP]
        } else {
          return path
        }
      }
      cur = engCur
      break
    }
  }

  let out: string | string[] = typeof cur === 'string' || Array.isArray(cur) ? cur : path

  if (vars && typeof out === 'string') {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, v)
    }
  }

  return typeof out === 'string' ? out : path
}
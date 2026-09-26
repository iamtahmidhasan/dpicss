import { cookies } from 'next/headers'
import type { AppLocale } from '@/lib/locale'

export async function POST(request: Request) {
  try {
    const { locale } = (await request.json()) as { locale: string }

    if (!locale || !['en', 'bn'].includes(locale)) {
      return Response.json({ error: 'Invalid locale' }, { status: 400 })
    }

    const cookieStore = await cookies()
    cookieStore.set('NEXT_LOCALE', locale as AppLocale, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    })

    return Response.json({ success: true, locale })
  } catch (error) {
    console.error('Failed to set locale:', error)
    return Response.json({ error: 'Failed to set locale' }, { status: 500 })
  }
}

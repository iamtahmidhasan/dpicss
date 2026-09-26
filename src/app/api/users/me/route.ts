import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { csrfHeaderName, getOrCreateCsrfToken } from '@/lib/csrf'

/**
 * Lightweight session probe for client hooks (e.g. mobile nav).
 * Always 200 — check `user`; avoids treating stale sessions as "network errors".
 */
export async function GET() {
  try {
    const payload = await getPayload({ config: await config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      const response = NextResponse.json({ user: null })
      const token = getOrCreateCsrfToken(response)
      response.headers.set(csrfHeaderName(), token)
      return response
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles ?? [],
        memberCategory: user.memberCategory ?? null,
        isVerified: user.isVerified ?? false,
        isActive: user.isActive ?? true,
      },
    })
    const token = getOrCreateCsrfToken(response)
    response.headers.set(csrfHeaderName(), token)
    return response
  } catch {
    const response = NextResponse.json({ user: null })
    const token = getOrCreateCsrfToken(response)
    response.headers.set(csrfHeaderName(), token)
    return response
  }
}

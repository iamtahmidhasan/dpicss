/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'
import { enforceCsrf } from '@/lib/csrf'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from '@/lib/rate-limit'

const graphqlPost = GRAPHQL_POST(config)

export async function POST(request: NextRequest): Promise<Response> {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  try {
    await checkRateLimit(request, {
      ...rateLimitConfigs.API,
      name: 'graphql',
      maxRequests: 30,
      windowMs: 60 * 1000,
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createRateLimitResponse(error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (process.env.NODE_ENV === 'production') {
    try {
      const body = (await request.clone().json()) as { query?: string }
      const query = body?.query || ''
      if (typeof query === 'string' && /__schema|__type/.test(query)) {
        return NextResponse.json(
          { error: 'GraphQL introspection disabled in production' },
          { status: 403 },
        )
      }
    } catch {
      // Non-JSON payloads handled by Payload route implementation.
    }
  }

  return graphqlPost(request)
}

export const OPTIONS = REST_OPTIONS(config)

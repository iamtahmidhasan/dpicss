// lib/payload-auth.ts
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers as nextHeaders } from 'next/headers'

export async function getCurrentUser() {
  const payload = await getPayload({ config: configPromise })
  const headers = await nextHeaders()

  // This helper checks the cookie/headers automatically
  const { user } = await payload.auth({ headers })

  return user || null
}

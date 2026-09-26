import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const settings = await (payload as unknown as {
      findGlobal: (args: { slug: string; depth?: number }) => Promise<Record<string, unknown>>
    }).findGlobal({
      slug: 'paymentSettings',
      depth: 0,
    })

    return NextResponse.json(settings || {})
  } catch (error) {
    console.error('[Payment Settings] Error:', error)
    return NextResponse.json({}, { status: 500 })
  }
}
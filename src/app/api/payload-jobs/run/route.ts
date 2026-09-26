import type { NextRequest } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const vercelCronSecret = process.env.VERCEL_CRONS_SECRET

    if (vercelCronSecret && authHeader !== `Bearer ${vercelCronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: Payload = await getPayload({ config })

    const result = await payload.jobs.run({
      queue: 'default',
    })

    return Response.json({
      success: true,
      processed: Object.keys(result?.jobStatus || {}).length,
      noJobsRemaining: result?.noJobsRemaining || false,
      remainingJobs: result?.remainingJobsFromQueried || 0,
      message: 'Jobs executed successfully',
    })
  } catch (error) {
    console.error('[Payload Jobs] Run error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
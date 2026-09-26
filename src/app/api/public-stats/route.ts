import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const [members, projects, achievements, events, sponsors] = await Promise.all([
      payload.count({
        collection: 'members',
        where: { isActive: { equals: true } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'projects' as any,
        where: {
          status: { in: ['published', 'completed'] },
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'achievements',
        where: { status: { equals: 'published' } },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'events' as any,
        where: {
          status: { in: ['published', 'completed'] },
        },
        overrideAccess: true,
      }),
      payload.find({
        collection: 'sponsors' as any,
        where: { status: { equals: 'published' } },
        select: {
          name: true,
          website: true,
          logo: true,
        },
        depth: 1,
        limit: 50,
        sort: 'tier',
        overrideAccess: true,
      }),
    ])

    return NextResponse.json({
      members: members.totalDocs,
      projects: projects.totalDocs,
      achievements: achievements.totalDocs,
      workshops: events.totalDocs,
      sponsors: sponsors.docs.map((s: any) => ({
        name: s.name,
        website: s.website || '',
        logo: s.logo?.url || '',
      })),
    })
  } catch (error) {
    console.error('[Public Stats API] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

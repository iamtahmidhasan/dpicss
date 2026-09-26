import { getPayload } from 'payload'
import config from '@payload-config'
import { NextRequest, NextResponse } from 'next/server'

const CLEANUP_SECRET = process.env.CLEANUP_SECRET || ''

export async function POST(req: NextRequest) {
  try {
    // Verify cleanup secret if configured
    if (CLEANUP_SECRET) {
      const authHeader = req.headers.get('authorization')
      if (!authHeader || authHeader !== `Bearer ${CLEANUP_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const payload = await getPayload({ config })
    const now = new Date().toISOString()

    // Find all unverified users with expired OTP
    const expiredUsers = await payload.find({
      collection: 'users',
      where: {
        and: [
          { isVerified: { equals: false } },
          { otpExpiry: { less_than: now } },
        ],
      },
      depth: 0,
      limit: 100,
      overrideAccess: true,
    })

    if (expiredUsers.docs.length === 0) {
      return NextResponse.json({ message: 'No expired accounts to clean up', deleted: 0 })
    }

    let deletedCount = 0

    for (const user of expiredUsers.docs) {
      try {
        // Get member category and profile IDs
        const memberCategory = user.memberCategory
        const officialProfileId = typeof user.officialMemberProfile === 'object'
          ? (user.officialMemberProfile as { id?: string })?.id
          : user.officialMemberProfile
        const unofficialProfileId = typeof user.unofficialMemberProfile === 'object'
          ? (user.unofficialMemberProfile as { id?: string })?.id
          : user.unofficialMemberProfile

        // Delete from members or unofficial-members collection
        if (memberCategory === 'official' && officialProfileId) {
          await payload.delete({
            collection: 'members',
            id: String(officialProfileId),
            overrideAccess: true,
          })
        } else if (memberCategory === 'unofficial' && unofficialProfileId) {
          await payload.delete({
            collection: 'unofficial-members',
            id: String(unofficialProfileId),
            overrideAccess: true,
          })
        }

        // Delete from users collection
        await payload.delete({
          collection: 'users',
          id: String(user.id),
          overrideAccess: true,
        })

        deletedCount++
        console.log(`[Cleanup] Deleted expired user: ${user.email}`)
      } catch (deleteError) {
        console.error(`[Cleanup] Failed to delete user ${user.id}:`, deleteError)
      }
    }

    return NextResponse.json({
      message: `Cleanup completed`,
      deleted: deletedCount,
    })
  } catch (error) {
    console.error('[Cleanup] Error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
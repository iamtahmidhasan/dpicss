import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { enforceCsrf } from '@/lib/csrf'

export async function PATCH(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })
    const { user: authUser } = await payload.auth({ headers: request.headers })

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user with minimal depth to avoid populated relationships
    const {
      docs: [user],
    } = await payload.find({
      collection: 'users',
      where: { id: { equals: authUser.id } },
      depth: 0,
      limit: 1,
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { firstName, lastName, bio, institutionName, department, avatar, skills, socialLinks } = body

    // Check one-time profile picture restriction
    if (avatar) {
      const regSettings = await (payload as any).findGlobal({
        slug: 'registration-settings',
        depth: 0,
      }) as { oneTimeProfilePicture?: boolean }

      if (regSettings?.oneTimeProfilePicture === true) {
        const collection =
          user.memberCategory === 'official' ? 'members' : 'unofficial-members'
        const profileId =
          user.memberCategory === 'official'
            ? (user.officialMemberProfile as string)
            : (user.unofficialMemberProfile as string)

        if (profileId) {
          const existingProfile = await payload.findByID({
            collection,
            id: profileId,
            depth: 0,
            select: { avatar: true },
          })

          if (existingProfile?.avatar) {
            return NextResponse.json(
              {
                error:
                  'Profile picture can only be set once. Please contact an administrator to change it.',
              },
              { status: 403 },
            )
          }
        }
      }
    }

    // Create a req object for Payload operations
    const req = { user, payload }

    // Update based on member category
    if (user.memberCategory === 'official' && user.officialMemberProfile) {
      // Update official member profile
      await payload.update({
        collection: 'members',
        id: user.officialMemberProfile as string,
        data: {
          firstName,
          lastName,
          bio,
          ...(avatar ? { avatar } : {}),
          skills: skills?.filter((s: { skill?: string }) => s.skill?.trim()) || [],
          socialLinks: socialLinks || null,
        } as any,
        req,
      })
    } else if (user.memberCategory === 'unofficial' && user.unofficialMemberProfile) {
      // Update unofficial member profile
      await payload.update({
        collection: 'unofficial-members',
        id: user.unofficialMemberProfile as string,
        data: {
          firstName,
          lastName,
          bio,
          institutionName,
          department,
          ...(avatar ? { avatar } : {}),
        },
        req,
      })
    } else {
      return NextResponse.json({ error: 'No profile found to update' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      success: true,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

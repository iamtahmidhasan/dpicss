import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { enforceCsrf } from '@/lib/csrf'
import { validateEmail, validatePassword, validateString } from '@/lib/validation'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const csrf = enforceCsrf(request)
  if (!csrf.ok) return csrf.response

  try {
    await checkRateLimit(request, rateLimitConfigs.AUTH)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return createRateLimitResponse(error)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>

    const firstName = validateString(body.firstName, {
      fieldName: 'First name',
      minLength: 1,
      maxLength: 100,
    })
    const lastName = validateString(body.lastName, {
      fieldName: 'Last name',
      minLength: 1,
      maxLength: 100,
    })
    const email = validateEmail(body.email)
    const password = validatePassword(body.password, {
      minLength: 8,
      requireNumbers: true,
    })

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Check if user already exists
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
    })

    if (existingUser.docs.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Create the user
    const user = await payload.create({
      collection: 'users',
      data: {
        email,
        password,
        roles: ['member'],
        memberCategory: 'unofficial', // Default to unofficial member
        isActive: true,
        isVerified: false, // Require email verification
      },
    })

    // Create unofficial member profile
    try {
      const unofficialMember = await payload.create({
        collection: 'unofficial-members',
        data: {
          firstName,
          lastName,
          email,
          user: user.id,
          institutionName: '',
          submissionDetails: '',
          status: 'pending',
        },
        req: request as any,
      })

      // Link the profile to the user
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          unofficialMemberProfile: unofficialMember.id,
        },
        req: request as any,
      })
    } catch {
      // Don't fail registration if profile creation fails
      // User is already created, they just won't have a profile initially
    }

    return NextResponse.json({
      message: 'Registration successful. Please verify your email to complete setup.',
      user: {
        id: user.id,
        email: user.email,
        isVerified: false,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('required') ||
        error.message.includes('invalid') ||
        error.message.includes('must')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

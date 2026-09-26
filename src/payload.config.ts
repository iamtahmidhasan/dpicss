import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import crypto from 'crypto'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { importExportPlugin } from '@payloadcms/plugin-import-export'
import { seoPlugin } from '@payloadcms/plugin-seo'
import imagekitPlugin from 'payloadcms-plugin-imagekit'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Members } from './collections/Members'
import { Committees } from './collections/Committees'
import { UnofficialMembers } from './collections/UnofficialMembers'
import { Courses } from './collections/Courses'
import { Enrollments } from './collections/Enrollments'
import { CourseReviews } from './collections/CourseReviews'
import { Categories } from './collections/Categories'
import { Posts } from './collections/Posts'
import { Achievements } from './collections/Achievements'
import { Announcements } from './collections/Announcements'
import { AnnouncementReads } from './collections/AnnouncementReads'
import { Activities } from './collections/Activities'
import { CourseModules } from './collections/CourseModules'
import { Shop } from './collections/Shop'
import { Teams } from './collections/Teams'
import { Events } from './collections/Events'
import { Projects } from './collections/Projects'
import { Sponsors } from './collections/Sponsors'
import { TicketEnrollments } from './collections/TicketEnrollments'
import { ContactSubmissions } from './collections/ContactSubmissions'
import { Popups } from './collections/Popups'
import { FooterSettings } from './globals/FooterSettings'
import { HeaderSettings } from './globals/HeaderSettings'
import { ContactSettings } from './globals/ContactSettings'
import { RegistrationSettings } from './globals/RegistrationSettings'
import { PaymentSettings } from './globals/PaymentSettings'
import { SiteSettings } from './globals/SiteSettings'
import { HomeSettings } from './globals/HomeSettings'
import { AboutSettings } from './globals/AboutSettings'
import { CoursesSettings } from './globals/CoursesSettings'
import { ShopSettings } from './globals/ShopSettings'
import { PostsSettings } from './globals/PostsSettings'
import { AchievementsSettings } from './globals/AchievementsSettings'
import { EventsSettings } from './globals/EventsSettings'
import { TeamsSettings } from './globals/TeamsSettings'
import { SearchSettings } from './globals/SearchSettings'
import { ContactPageSettings } from './globals/ContactPageSettings'
import { SponsorsSettings } from './globals/SponsorsSettings'
import { MembersSettings } from './globals/MembersSettings'
import { ProjectsSettings } from './globals/ProjectsSettings'
import { sendOtpEmail, sendPasswordResetEmail } from './lib/mail'
import {
  validateEmail,
  validatePassword,
  validateString,
  validateUsername,
  getSafeErrorMessage,
} from './lib/validation'
import {
  checkRateLimit,
  createRateLimitResponse,
  RateLimitError,
  rateLimitConfigs,
} from './lib/rate-limit'
import {
  addMinutes,
  enforcePayloadCsrf,
  generateOTP,
  getBody,
  hashOTP,
  hashOTPLegacy,
  hashResetToken,
  MIN_PASSWORD_LENGTH,
  OTP_EXPIRY_MINUTES,
  OTP_MAX_ATTEMPTS,
} from './lib/payload-auth-utils'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const IMAGE_KIT_PUBLIC_KEY = process.env.IMAGE_KIT_PUBLIC_KEY?.trim() || ''
const IMAGE_KIT_PRIVATE_KEY = process.env.IMAGE_KIT_PRIVATE_KEY?.trim() || ''
const IMAGE_KIT_URL = process.env.IMAGE_KIT_URL?.trim() || ''
const isImageKitPluginEnabled = Boolean(
  IMAGE_KIT_PUBLIC_KEY && IMAGE_KIT_PRIVATE_KEY && IMAGE_KIT_URL,
)

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

const validateEnv = (key: string): string => {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const validateOptionalEnv = (key: string, defaultValue?: string): string => {
  return process.env[key]?.trim() || defaultValue || ''
}

// Validate critical env vars
const PAYLOAD_SECRET = validateEnv('PAYLOAD_SECRET')
const DATABASE_URL = validateEnv('DATABASE_URL')

// Warn on weak OTP secret
if (PAYLOAD_SECRET.length < 24) {
  console.warn('⚠️  WARNING: PAYLOAD_SECRET should be at least 24 characters for security')
}

const SERVER_URL = validateOptionalEnv('NEXT_PUBLIC_SERVER_URL', 'https://dpirc.com')

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      beforeDashboard: ['/components/DashboardActivities'],
    },
  },
  localization: {
    defaultLocale: 'en',
    fallback: true,
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Bangla', code: 'bn' },
    ],
  },
  collections: [
    // System & Authentication
    Users,
    Activities,

    // User Management
    Members,
    Committees,
    UnofficialMembers,

    // Content Management
    Media,
    Categories,
    Posts,
    Achievements,
    Announcements,
    Shop,
    Teams,
    Events,
    Projects,
    Sponsors,

    // Learning Management
    Courses,
    CourseModules,
    Enrollments,
    CourseReviews,
    TicketEnrollments,
    ContactSubmissions,

    // System
    AnnouncementReads,
    Popups,
  ],
  globals: [
    HeaderSettings, FooterSettings, ContactSettings, RegistrationSettings,
    PaymentSettings, SiteSettings,
    HomeSettings, AboutSettings, CoursesSettings, ShopSettings,
    PostsSettings, AchievementsSettings, EventsSettings, TeamsSettings,
    SearchSettings, ContactPageSettings,
    SponsorsSettings, MembersSettings, ProjectsSettings,
  ],
  editor: lexicalEditor(),
  secret: PAYLOAD_SECRET,
  serverURL: SERVER_URL,
  csrf: [SERVER_URL],
  cors: [SERVER_URL],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: DATABASE_URL,
  }),
  sharp,
  folders: {},
  jobs: {
    access: {
      run: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
      queue: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
      cancel: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
    },
    autoRun: [
      {
        cron: '*/5 * * * *',
        queue: 'default',
      },
    ],
  },
  plugins: [
    importExportPlugin({
      collections: [
        { slug: 'courses' },
        { slug: 'posts' },
        { slug: 'achievements' },
        { slug: 'categories' },
        { slug: 'members' },
        { slug: 'shop' },
      ],
    }),
    seoPlugin({
      collections: [
        'courses',
        'posts',
        'achievements',
        'shop',
        'categories',
        'members',
        'events',
        'teams',
        'projects',
        'sponsors',
      ],
      uploadsCollection: 'media',
    }),
    ...(isImageKitPluginEnabled
      ? [
          imagekitPlugin({
            config: {
              publicKey: IMAGE_KIT_PUBLIC_KEY,
              privateKey: IMAGE_KIT_PRIVATE_KEY,
              endpoint: IMAGE_KIT_URL,
            },
            collections: {
              media: {
                uploadOption: {
                  folder: '/dpirc/media',
                },
                savedProperties: ['url', 'name', 'height', 'width', 'size', 'fileType'],
                disableLocalStorage: true,
              },
            },
          }),
        ]
      : []),
  ],
  endpoints: [
    {
      path: '/auth/signup',
      method: 'post',
      handler: async (req) => {
        const csrf = enforcePayloadCsrf(req, SERVER_URL)
        if (csrf) return csrf

        try {
          await checkRateLimit(req, rateLimitConfigs.AUTH)

          const body = await getBody(req)

          // Extract fields with defaults
          const memberIntent =
            body?.memberIntent === 'official' || body?.memberIntent === 'unofficial'
              ? body.memberIntent
              : null
          const password = body?.password

          // Validate required fields
          if (!memberIntent) {
            return Response.json(
              { error: 'Member type (official/unofficial) is required' },
              { status: 400 },
            )
          }

          if (memberIntent !== 'official' && memberIntent !== 'unofficial') {
            return Response.json(
              { error: 'Member type must be "official" or "unofficial"' },
              { status: 400 },
            )
          }

          // ✅ Validated fields
          const firstName = validateString(body?.firstName, {
            fieldName: 'First name',
            minLength: 1,
            maxLength: 100,
          })
          const lastName = validateString(body?.lastName, {
            fieldName: 'Last name',
            minLength: 1,
            maxLength: 100,
          })
          const email = validateEmail(body?.email)
          const validatedPassword = validatePassword(password, {
            minLength: MIN_PASSWORD_LENGTH,
            requireNumbers: true,
          })

          // Optional fields
          const bio =
            typeof body?.bio === 'string'
              ? validateString(body.bio, {
                  fieldName: 'Bio',
                  maxLength: 500,
                })
              : ''
          const avatar = typeof body?.avatar === 'string' ? body.avatar : null

          // Member-type specific fields
          let username = ''
          let institutionName = ''
          let department = ''

          if (memberIntent === 'official') {
            username = validateUsername(body?.username)
          } else {
            // Unofficial member requirements
            institutionName = validateString(body?.institutionName, {
              fieldName: 'Institution name',
              minLength: 2,
              maxLength: 200,
            })
            department = validateString(body?.department || '', {
              fieldName: 'Department',
              maxLength: 100,
            })
          }

          // Check for existing user
          const existingUser = await req.payload.find({
            collection: 'users',
            where: { email: { equals: email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          if (existingUser.docs.length > 0 && existingUser.docs[0]?.isVerified) {
            return Response.json({ error: 'Account already exists' }, { status: 409 })
          }

          const otp = generateOTP()
          const otpHash = hashOTP(otp, email, PAYLOAD_SECRET)
          const otpExpiry = addMinutes(OTP_EXPIRY_MINUTES).toISOString()

          let userId: string
          if (existingUser.docs.length > 0) {
            const existingId = String(existingUser.docs[0]?.id || '')
            if (!existingId) {
              return Response.json({ error: 'Failed to process existing user' }, { status: 500 })
            }

            const existingUserData = existingUser.docs[0]

            // Clean up old profile if exists (for unverified users trying again)
            const existingOfficialProfileId =
              typeof existingUserData.officialMemberProfile === 'object'
                ? existingUserData.officialMemberProfile?.id
                : existingUserData.officialMemberProfile
            const existingUnofficialProfileId =
              typeof existingUserData.unofficialMemberProfile === 'object'
                ? existingUserData.unofficialMemberProfile?.id
                : existingUserData.unofficialMemberProfile

            // Delete old profiles to allow fresh registration
            if (existingOfficialProfileId) {
              try {
                await req.payload.delete({
                  collection: 'members',
                  id: String(existingOfficialProfileId),
                  overrideAccess: true,
                  req,
                })
              } catch (e) {
                // Ignore if profile already deleted
              }
            }
            if (existingUnofficialProfileId) {
              try {
                await req.payload.delete({
                  collection: 'unofficial-members',
                  id: String(existingUnofficialProfileId),
                  overrideAccess: true,
                  req,
                })
              } catch (e) {
                // Ignore if profile already deleted
              }
            }

            await req.payload.update({
              collection: 'users',
              id: existingId,
              data: {
                email,
                password: validatedPassword,
                roles:
                  memberIntent === 'official'
                    ? ['member', 'official_member']
                    : ['member', 'unofficial_member'],
                memberCategory: memberIntent,
                isVerified: false,
                isActive: true,
                otp: otpHash,
                otpExpiry,
                otpAttempts: 0,
                officialMemberProfile: null,
                unofficialMemberProfile: null,
              },
              overrideAccess: true,
            })
            userId = existingId
          } else {
            const createdUser = await req.payload.create({
              collection: 'users',
              data: {
                email,
                password: validatedPassword,
                roles:
                  memberIntent === 'official'
                    ? ['member', 'official_member']
                    : ['member', 'unofficial_member'],
                memberCategory: memberIntent,
                isVerified: false,
                otp: otpHash,
                otpExpiry,
                otpAttempts: 0,
              },
              overrideAccess: true,
            })
            userId = String(createdUser?.id || '')
          }

          if (memberIntent === 'official') {
            const existingOfficialProfile = await req.payload.find({
              collection: 'members',
              where: { email: { equals: email } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })

            const existingByUsername = await req.payload.find({
              collection: 'members',
              where: { username: { equals: username } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })

            if (
              existingByUsername.docs.length > 0 &&
              (!existingOfficialProfile.docs[0] ||
                String(existingByUsername.docs[0].id) !==
                  String(existingOfficialProfile.docs[0].id))
            ) {
              return Response.json(
                { error: 'Username already taken. Please choose another one.' },
                { status: 409 },
              )
            }

            let officialProfileId: string
            if (existingOfficialProfile.docs.length > 0) {
              const updatedOfficialProfile = await req.payload.update({
                collection: 'members',
                id: existingOfficialProfile.docs[0].id,
                data: {
                  user: userId,
                  username,
                  firstName,
                  lastName,
                  email,
                  memberType: 'student',
                  bio,
                  isActive: true,
                  directoryApprovalStatus: 'pending',
                },
                overrideAccess: true,
              })
              officialProfileId = String(updatedOfficialProfile.id)
            } else {
              const createdOfficialProfile = await req.payload.create({
                collection: 'members',
                data: {
                  user: userId,
                  username,
                  firstName,
                  lastName,
                  email,
                  memberType: 'student',
                  bio,
                  isActive: true,
                  directoryApprovalStatus: 'pending',
                } as any,
                overrideAccess: true,
              })
              officialProfileId = String(createdOfficialProfile.id)
            }

            await req.payload.update({
              collection: 'users',
              id: userId,
              data: {
                officialMemberProfile: officialProfileId,
                unofficialMemberProfile: null,
              },
              overrideAccess: true,
            })
          } else {
            const existingUnofficialProfile = await req.payload.find({
              collection: 'unofficial-members',
              where: { email: { equals: email } },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })

            let unofficialProfileId: string
            if (existingUnofficialProfile.docs.length > 0) {
              const updatedUnofficialProfile = await req.payload.update({
                collection: 'unofficial-members',
                id: existingUnofficialProfile.docs[0].id,
                data: {
                  user: userId,
                  firstName,
                  lastName,
                  email,
                  institutionName,
                  department,
                  status: 'pending',
                },
                overrideAccess: true,
              })
              unofficialProfileId = String(updatedUnofficialProfile.id)
            } else {
              const createdUnofficialProfile = await req.payload.create({
                collection: 'unofficial-members',
                data: {
                  user: userId,
                  firstName,
                  lastName,
                  email,
                  institutionName,
                  department,
                  status: 'pending',
                } as any,
                overrideAccess: true,
              })
              unofficialProfileId = String(createdUnofficialProfile.id)
            }

            await req.payload.update({
              collection: 'users',
              id: userId,
              data: {
                officialMemberProfile: null,
                unofficialMemberProfile: unofficialProfileId,
              },
              overrideAccess: true,
            })
          }

          const otpSend = await sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES)
          if (!otpSend.ok) {
            console.error(`[OTP] Failed to send signup OTP to ${email}:`, otpSend.detail)
            return Response.json(
              {
                error:
                  'Unable to send verification email. If this continues, contact support — the server mail settings may need to be updated.',
              },
              { status: 502 },
            )
          }
          console.info(`[OTP] Signup OTP dispatched to ${email}`, {
            channel: otpSend.channel,
            messageId: otpSend.channel === 'smtp' ? otpSend.messageId : undefined,
          })

          return Response.json({
            message: 'Signup successful. Please verify OTP sent to your email.',
          })
        } catch (error) {
          const errorMsg = getSafeErrorMessage(error)
          console.error('[Signup] Error:', error instanceof Error ? error.message : error)
          return Response.json({ error: errorMsg }, { status: 400 })
        }
      },
    },
    {
      path: '/auth/verify-otp',
      method: 'post',
      handler: async (req) => {
        const csrf = enforcePayloadCsrf(req, SERVER_URL)
        if (csrf) return csrf

        // ✅ SECURITY: Apply rate limiting to prevent brute force
        try {
          await checkRateLimit(req, rateLimitConfigs.OTP_VERIFY)
        } catch (error) {
          if (error instanceof RateLimitError) {
            return createRateLimitResponse(error)
          }
          throw error
        }

        try {
          const body = await getBody(req)
          const email = validateEmail(body?.email)
          const otp = validateString(body?.otp, {
            fieldName: 'OTP code',
            minLength: 6,
            maxLength: 6,
            pattern: /^\d{6}$/,
          })

          const userRes = await req.payload.find({
            collection: 'users',
            where: { email: { equals: email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          if (userRes.docs.length === 0) {
            // Don't reveal whether email exists (prevent user enumeration)
            return Response.json({ error: 'Invalid email or OTP' }, { status: 400 })
          }

          const user = userRes.docs[0]
          const attempts = user.otpAttempts || 0
          if (attempts >= OTP_MAX_ATTEMPTS) {
            return Response.json(
              { error: 'Too many attempts. Please request a new OTP.' },
              { status: 429 },
            )
          }

          if (!user.otp || !user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
            // OTP expired - clean up user and their profile
            const memberCategory = user.memberCategory
            const officialProfileId =
              typeof user.officialMemberProfile === 'object'
                ? user.officialMemberProfile?.id
                : user.officialMemberProfile
            const unofficialProfileId =
              typeof user.unofficialMemberProfile === 'object'
                ? user.unofficialMemberProfile?.id
                : user.unofficialMemberProfile

            // Delete profile if exists
            if (memberCategory === 'official' && officialProfileId) {
              try {
                await req.payload.delete({
                  collection: 'members',
                  id: String(officialProfileId),
                  overrideAccess: true,
                  req,
                })
              } catch {
                /* ignore */
              }
            } else if (memberCategory === 'unofficial' && unofficialProfileId) {
              try {
                await req.payload.delete({
                  collection: 'unofficial-members',
                  id: String(unofficialProfileId),
                  overrideAccess: true,
                  req,
                })
              } catch {
                /* ignore */
              }
            }

            // Delete user
            await req.payload.delete({
              collection: 'users',
              id: String(user.id),
              overrideAccess: true,
              req,
            })

            return Response.json({ error: 'OTP expired. Please register again.' }, { status: 400 })
          }

          const isMatch =
            user.otp === hashOTP(otp, email, PAYLOAD_SECRET) ||
            user.otp === hashOTPLegacy(otp, PAYLOAD_SECRET)

          if (!isMatch) {
            await req.payload.update({
              collection: 'users',
              id: user.id,
              data: {
                otpAttempts: attempts + 1,
              },
              overrideAccess: true,
            })

            return Response.json({ error: 'Invalid email or OTP' }, { status: 400 })
          }

          await req.payload.update({
            collection: 'users',
            id: user.id,
            data: {
              isVerified: true,
              otp: '',
              otpExpiry: null,
              otpAttempts: 0,
            },
            overrideAccess: true,
          })

          const refreshed = await req.payload.findByID({
            collection: 'users',
            id: user.id,
            depth: 2,
            overrideAccess: true,
          })

          let profileUsername: string | null = null
          let pendingDirectoryApproval = false
          const officialRef = refreshed.officialMemberProfile
          if (officialRef && typeof officialRef === 'object' && 'username' in officialRef) {
            profileUsername = String((officialRef as { username?: string }).username || '') || null
            const status = (officialRef as { directoryApprovalStatus?: string })
              .directoryApprovalStatus
            pendingDirectoryApproval = status === 'pending'
          }

          return Response.json({
            message: 'Account verified successfully',
            profileUsername,
            pendingDirectoryApproval,
          })
        } catch (error) {
          const errorMsg = getSafeErrorMessage(error)
          console.error('[OTP Verify] Error:', error instanceof Error ? error.message : error)
          return Response.json({ error: errorMsg }, { status: 400 })
        }
      },
    },
    {
      path: '/auth/resend-otp',
      method: 'post',
      handler: async (req) => {
        const csrf = enforcePayloadCsrf(req, SERVER_URL)
        if (csrf) return csrf

        // ✅ SECURITY: Apply rate limiting to prevent abuse
        try {
          await checkRateLimit(req, rateLimitConfigs.OTP_RESEND)
        } catch (error) {
          if (error instanceof RateLimitError) {
            return createRateLimitResponse(error)
          }
          throw error
        }

        try {
          const body = await getBody(req)
          const email = validateEmail(body?.email)

          const userRes = await req.payload.find({
            collection: 'users',
            where: { email: { equals: email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          if (userRes.docs.length === 0) {
            // Don't reveal whether email exists
            return Response.json(
              { message: 'If account exists, OTP will be sent to that email' },
              { status: 200 },
            )
          }

          const user = userRes.docs[0]
          if (user.isVerified) {
            return Response.json({ error: 'Account is already verified' }, { status: 400 })
          }

          const otp = generateOTP()
          await req.payload.update({
            collection: 'users',
            id: user.id,
            data: {
              otp: hashOTP(otp, email, PAYLOAD_SECRET),
              otpExpiry: addMinutes(OTP_EXPIRY_MINUTES).toISOString(),
              otpAttempts: 0,
            },
            overrideAccess: true,
          })

          const otpResend = await sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES)
          if (!otpResend.ok) {
            console.error(`[OTP] Failed to resend OTP to ${email}:`, otpResend.detail)
            return Response.json(
              {
                error:
                  'Unable to send verification email. If this continues, contact support — the server mail settings may need to be updated.',
              },
              { status: 502 },
            )
          }
          console.info(`[OTP] Resent OTP to ${email}`, {
            channel: otpResend.channel,
            messageId: otpResend.channel === 'smtp' ? otpResend.messageId : undefined,
          })

          return Response.json({
            message: 'OTP resent successfully',
          })
        } catch (error) {
          const errorMsg = getSafeErrorMessage(error)
          console.error('[OTP Resend] Error:', error instanceof Error ? error.message : error)
          return Response.json({ error: errorMsg }, { status: 400 })
        }
      },
    },
    {
      path: '/auth/forgot-password',
      method: 'post',
      handler: async (req) => {
        const csrf = enforcePayloadCsrf(req, SERVER_URL)
        if (csrf) return csrf

        // ✅ SECURITY: Apply rate limiting
        try {
          await checkRateLimit(req, rateLimitConfigs.PASSWORD_RESET)
        } catch (error) {
          if (error instanceof RateLimitError) {
            return createRateLimitResponse(error)
          }
          throw error
        }

        try {
          const body = await getBody(req)
          const email = validateEmail(body?.email)

          const userRes = await req.payload.find({
            collection: 'users',
            where: { email: { equals: email } },
            limit: 1,
            depth: 0,
            overrideAccess: true,
          })

          // Return generic success to avoid user enumeration.
          if (userRes.docs.length === 0) {
            return Response.json({ message: 'If that email exists, a reset link has been sent.' })
          }

          const token = crypto.randomBytes(32).toString('hex')
          const tokenHash = hashResetToken(token, PAYLOAD_SECRET)
          const resetExpiry = addMinutes(60).toISOString()

          await req.payload.update({
            collection: 'users',
            id: userRes.docs[0].id,
            data: {
              resetPasswordToken: tokenHash,
              resetPasswordExpiration: resetExpiry,
            },
            overrideAccess: true,
          })

          try {
            const mail = await sendPasswordResetEmail(email, token)
            console.info(`[AUTH] Sent password reset email to ${email}`, mail)
          } catch (error) {
            console.error(`[AUTH] Failed to send password reset email to ${email}`, error)
            return Response.json(
              { error: 'Unable to send reset email. Please try again.' },
              { status: 502 },
            )
          }

          return Response.json({ message: 'If that email exists, a reset link has been sent.' })
        } catch (error) {
          const errorMsg = getSafeErrorMessage(error)
          console.error('[Forgot Password] Error:', error instanceof Error ? error.message : error)
          // Return generic message for security
          return Response.json({ message: 'If that email exists, a reset link has been sent.' })
        }
      },
    },
    {
      path: '/auth/account',
      method: 'patch',
      handler: async (req) => {
        const csrf = enforcePayloadCsrf(req, SERVER_URL)
        if (csrf) return csrf

        if (!req.user) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await getBody(req)
        const firstName = typeof body?.firstName === 'string' ? body.firstName.trim() : ''
        const lastName = typeof body?.lastName === 'string' ? body.lastName.trim() : ''
        const bio = typeof body?.bio === 'string' ? body.bio.trim() : ''
        const avatar = typeof body?.avatar === 'string' ? body.avatar : undefined
        const institutionName =
          typeof body?.institutionName === 'string' ? body.institutionName.trim() : ''
        const department = typeof body?.department === 'string' ? body.department.trim() : ''
        const submissionDetails =
          typeof body?.submissionDetails === 'string' ? body.submissionDetails.trim() : ''

        if (!firstName || !lastName) {
          return Response.json({ error: 'First name and last name are required' }, { status: 400 })
        }

        if (req.user.memberCategory === 'official') {
          const profileId =
            typeof req.user.officialMemberProfile === 'object'
              ? req.user.officialMemberProfile?.id
              : req.user.officialMemberProfile

          if (!profileId) {
            return Response.json({ error: 'Official member profile not linked' }, { status: 404 })
          }

          await req.payload.update({
            collection: 'members',
            id: String(profileId),
            data: {
              firstName,
              lastName,
              bio,
              ...(avatar ? { avatar } : {}),
            },
            user: req.user,
            overrideAccess: false,
          })
        } else {
          const profileId =
            typeof req.user.unofficialMemberProfile === 'object'
              ? req.user.unofficialMemberProfile?.id
              : req.user.unofficialMemberProfile

          if (!profileId) {
            return Response.json({ error: 'Unofficial member profile not linked' }, { status: 404 })
          }

          await req.payload.update({
            collection: 'unofficial-members',
            id: String(profileId),
            data: {
              firstName,
              lastName,
              institutionName,
              department,
              submissionDetails,
              ...(avatar ? { avatar } : {}),
            },
            user: req.user,
            overrideAccess: false,
          })
        }

        return Response.json({ message: 'Account updated successfully' })
      },
    },
    // Certificate verification endpoint
    {
      path: '/verify-certificate/:code',
      method: 'get',
      handler: async (req) => {
        const { code } = req.routeParams as { code: string }
        const certificateId = decodeURIComponent(code || '').trim()

        if (!certificateId) {
          return Response.json({ error: 'Certificate ID is required' }, { status: 400 })
        }

        type ManualCertificate = {
          certificateId?: string
          course?: { title?: string } | string
          certificateImageUrl?: string
        }
        type MemberDoc = {
          firstName?: string
          lastName?: string
          memberId?: string
          email?: string
          manualCertificates?: ManualCertificate[]
        }

        const findCertInMember = (doc: MemberDoc) =>
          doc.manualCertificates?.find((c) => c.certificateId === certificateId)

        try {
          const official = await req.payload.find({
            collection: 'members',
            where: { 'manualCertificates.certificateId': { equals: certificateId } },
            depth: 2,
            limit: 1,
            overrideAccess: true,
          })

          if (official.docs.length > 0) {
            const member = official.docs[0] as MemberDoc
            const cert = findCertInMember(member)
            const courseTitle =
              cert?.course && typeof cert.course === 'object' ? cert.course.title : undefined
            const recipientName = [member.firstName, member.lastName].filter(Boolean).join(' ')

            return Response.json({
              valid: true,
              certificateId: cert?.certificateId || certificateId,
              recipientName,
              memberId: member.memberId,
              memberType: 'official',
              email: member.email,
              courseTitle,
              certificateImageUrl: cert?.certificateImageUrl,
            })
          }

          const unofficial = await req.payload.find({
            collection: 'unofficial-members',
            where: { 'manualCertificates.certificateId': { equals: certificateId } },
            depth: 2,
            limit: 1,
            overrideAccess: true,
          })

          if (unofficial.docs.length > 0) {
            const member = unofficial.docs[0] as MemberDoc
            const cert = findCertInMember(member)
            const courseTitle =
              cert?.course && typeof cert.course === 'object' ? cert.course.title : undefined
            const recipientName = [member.firstName, member.lastName].filter(Boolean).join(' ')

            return Response.json({
              valid: true,
              certificateId: cert?.certificateId || certificateId,
              recipientName,
              memberType: 'unofficial',
              email: member.email,
              courseTitle,
              certificateImageUrl: cert?.certificateImageUrl,
            })
          }

          return Response.json({ valid: false, error: 'Certificate not found' }, { status: 404 })
        } catch (error) {
          console.error('Certificate verification error:', error)
          return Response.json({ error: 'Verification failed' }, { status: 500 })
        }
      },
    },
    // Member verification endpoint
    {
      path: '/verify-member/:memberId',
      method: 'get',
      handler: async (req) => {
        // ✅ SECURITY: Require authentication to prevent user enumeration
        if (!req.user) {
          return Response.json({ error: 'Unauthorized: Authentication required' }, { status: 401 })
        }

        const { memberId } = req.routeParams as { memberId: string }

        if (!memberId?.trim()) {
          return Response.json({ error: 'Member ID is required' }, { status: 400 })
        }

        try {
          const member = await req.payload.find({
            collection: 'members',
            where: {
              memberId: { equals: memberId },
            },
            depth: 0,
            limit: 1,
            req, // ✅ Enforce access control
          })

          if (member.docs.length === 0) {
            return Response.json({ valid: false }, { status: 404 })
          }

          const mem = member.docs[0]

          // Return member verification data (no email to prevent enumeration)
          return Response.json({
            valid: true,
            memberId: mem.memberId,
            firstName: mem.firstName,
            lastName: mem.lastName,
            memberType: mem.memberType,
            joinedAt: mem.createdAt,
            isActive: mem.isActive,
          })
        } catch (error) {
          console.error('Member verification error:', error)
          return Response.json({ error: 'Verification failed' }, { status: 500 })
        }
      },
    },
    // Cleanup expired OTP accounts
    {
      path: '/auth/cleanup-expired',
      method: 'post',
      handler: async (req) => {
        const csrf = enforcePayloadCsrf(req, SERVER_URL)
        if (csrf) return csrf

        // Only allow admin users to trigger cleanup
        const { user: authUser } = req
        if (!authUser || !authUser.roles?.includes('admin')) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const now = new Date().toISOString()

          // Find all unverified users with expired OTP
          const expiredUsers = await req.payload.find({
            collection: 'users',
            where: {
              and: [{ isVerified: { equals: false } }, { otpExpiry: { less_than: now } }],
            },
            depth: 0,
            limit: 100,
            overrideAccess: true,
          })

          if (expiredUsers.docs.length === 0) {
            return Response.json({ message: 'No expired accounts to clean up', deleted: 0 })
          }

          let deletedCount = 0

          for (const user of expiredUsers.docs) {
            try {
              // Get member category and profile IDs
              const memberCategory = user.memberCategory
              const officialProfileId =
                typeof user.officialMemberProfile === 'object'
                  ? user.officialMemberProfile?.id
                  : user.officialMemberProfile
              const unofficialProfileId =
                typeof user.unofficialMemberProfile === 'object'
                  ? user.unofficialMemberProfile?.id
                  : user.unofficialMemberProfile

              // Delete from members or unofficial-members collection
              if (memberCategory === 'official' && officialProfileId) {
                await req.payload.delete({
                  collection: 'members',
                  id: String(officialProfileId),
                  overrideAccess: true,
                  req,
                })
              } else if (memberCategory === 'unofficial' && unofficialProfileId) {
                await req.payload.delete({
                  collection: 'unofficial-members',
                  id: String(unofficialProfileId),
                  overrideAccess: true,
                  req,
                })
              }

              // Delete from users collection
              await req.payload.delete({
                collection: 'users',
                id: String(user.id),
                overrideAccess: true,
                req,
              })

              deletedCount++
              console.log(`[Cleanup] Deleted expired user: ${user.email}`)
            } catch (deleteError) {
              console.error(`[Cleanup] Failed to delete user ${user.id}:`, deleteError)
            }
          }

          return Response.json({
            message: `Cleanup completed`,
            deleted: deletedCount,
          })
        } catch (error) {
          console.error('[Cleanup] Error:', error)
          return Response.json({ error: 'Cleanup failed' }, { status: 500 })
        }
      },
    },
  ],
})

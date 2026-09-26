import crypto from 'crypto'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_SERVER_URL || ''}/api/auth/google`
const STATE_SECRET = process.env.PAYLOAD_SECRET || 'fallback-secret'

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
  throw new Error(
    'Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI'
  )
}

export interface GoogleUserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  picture: string
}

export interface OAuthState {
  memberIntent: 'official' | 'unofficial' | 'none'
  flowType: 'login' | 'register'
  nonce: string
  institutionName?: string
  department?: string
}

const VALID_INTENTS: OAuthState['memberIntent'][] = ['official', 'unofficial', 'none']
const VALID_FLOWS: OAuthState['flowType'][] = ['login', 'register']

export function getGoogleAuthUrl(
  memberIntent: 'official' | 'unofficial' | 'none',
  flowType: 'login' | 'register',
  institutionName?: string,
  department?: string
): string {
  const state = generateSignedState(memberIntent, flowType, institutionName, department)

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID as string,
    redirect_uri: GOOGLE_REDIRECT_URI as string,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  })

  if (flowType === 'register') {
    params.set('access_type', 'offline')
    params.set('prompt', 'consent')
  } else {
    params.set('prompt', 'select_account')
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export function generateSignedState(
  memberIntent: 'official' | 'unofficial' | 'none',
  flowType: 'login' | 'register',
  institutionName?: string,
  department?: string
): string {
  const state: OAuthState = {
    memberIntent,
    flowType,
    nonce: crypto.randomBytes(16).toString('hex'),
    ...(institutionName && { institutionName }),
    ...(department && { department }),
  }

  const payload = Buffer.from(JSON.stringify(state)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(payload)
    .digest('base64url')

  return `${payload}.${signature}`
}

export function verifySignedState(encodedState: string): OAuthState | null {
  try {
    const [payload, signature] = encodedState.split('.')
    if (!payload || !signature) return null

    const expectedSignature = crypto
      .createHmac('sha256', STATE_SECRET)
      .update(payload)
      .digest('base64url')

    if (signature !== expectedSignature) return null

    const state = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OAuthState

    if (!VALID_FLOWS.includes(state.flowType)) return null

    if (state.flowType === 'register') {
      if (!state.memberIntent || !VALID_INTENTS.includes(state.memberIntent)) return null
    }

    if (!state.nonce) return null

    return state
  } catch {
    return null
  }
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  id_token: string
} | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID as string,
        client_secret: GOOGLE_CLIENT_SECRET as string,
        code,
        grant_type: 'authorization_code',
        redirect_uri: GOOGLE_REDIRECT_URI as string,
      }),
    })

    if (!response.ok) {
      console.error('Google token exchange failed:', await response.text())
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Google token exchange error:', error)
    return null
  }
}

export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo?alt=json',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    if (!response.ok) {
      console.error('Google userinfo failed:', await response.text())
      return null
    }

    const data = await response.json()

    return {
      id: data.id,
      email: data.email,
      firstName: data.given_name || '',
      lastName: data.family_name || '',
      picture: data.picture || '',
    }
  } catch (error) {
    console.error('Google userinfo error:', error)
    return null
  }
}
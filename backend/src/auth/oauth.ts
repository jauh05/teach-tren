import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { config } from '../config/index.js'
import { prisma } from '../db.js'
import { hashPassword } from './password.js'

// Sign-in with Google, Facebook, and TikTok (authorization code flow). The provider sends the user back to our callback
// with a code. The server exchanges the code for a token, reads the profile, and then signs the user in.
export const PROVIDER_IDS = ['google', 'facebook', 'tiktok'] as const
export type ProviderId = (typeof PROVIDER_IDS)[number]

export const PROVIDER_NAMES: Record<ProviderId, string> = { google: 'Google', facebook: 'Facebook', tiktok: 'TikTok' }

export interface ProviderSettings {
  // Google and Facebook call this the client id or app id. TikTok calls it the client key.
  clientId: string
  clientSecret: string
}

export interface OAuthProfile {
  providerUserId: string
  name: string
  // Null when the provider does not share an email (TikTok, or a Facebook account without one).
  email: string | null
  // Only a verified email may link to an existing account. Otherwise someone could claim another person's account.
  emailVerified: boolean
}

// Why a sign-in did not finish. The reason is shown to the user (see AuthPage).
export class OAuthError extends Error {
  readonly reason: 'gagal' | 'email-dipakai'

  constructor(reason: 'gagal' | 'email-dipakai') {
    super(reason)
    this.name = 'OAuthError'
    this.reason = reason
  }
}

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value)
}

// A provider is on only when the frontend address and both of its keys are set. Empty values count as not set.
export function providerSettings(provider: ProviderId): ProviderSettings | null {
  if (!config.OAUTH_BASE_URL) {
    return null
  }
  const pairs: Record<ProviderId, [string | undefined, string | undefined]> = {
    google: [config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET],
    facebook: [config.FACEBOOK_APP_ID, config.FACEBOOK_APP_SECRET],
    tiktok: [config.TIKTOK_CLIENT_KEY, config.TIKTOK_CLIENT_SECRET],
  }
  const [clientId, clientSecret] = pairs[provider]
  return clientId && clientSecret ? { clientId, clientSecret } : null
}

// Where the provider sends the user back. The address must be registered in the provider's console.
export function callbackUrl(baseUrl: string, provider: ProviderId): string {
  return `${baseUrl.replace(/\/$/, '')}/api/auth/oauth/${provider}/callback`
}

export function authorizeUrl(provider: ProviderId, settings: ProviderSettings, redirectUri: string, state: string): string {
  if (provider === 'google') {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.search = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    }).toString()
    return url.toString()
  }
  if (provider === 'facebook') {
    const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')
    url.search = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    }).toString()
    return url.toString()
  }
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.search = new URLSearchParams({
    client_key: settings.clientId,
    scope: 'user.info.basic',
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
  }).toString()
  return url.toString()
}

const tokenSchema = z.object({ access_token: z.string().min(1) })

// Exchanges the code for an access token. Any refusal from the provider counts as a failed sign-in.
async function exchangeCode(
  provider: ProviderId,
  settings: ProviderSettings,
  code: string,
  redirectUri: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  let response: Response
  if (provider === 'facebook') {
    const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
    url.search = new URLSearchParams({
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      redirect_uri: redirectUri,
      code,
    }).toString()
    response = await fetchImpl(url)
  } else {
    const endpoint = provider === 'google' ? 'https://oauth2.googleapis.com/token' : 'https://open.tiktokapis.com/v2/oauth/token/'
    const idField = provider === 'google' ? 'client_id' : 'client_key'
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        [idField]: settings.clientId,
        client_secret: settings.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    })
  }
  if (!response.ok) {
    throw new OAuthError('gagal')
  }
  const parsed = tokenSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new OAuthError('gagal')
  }
  return parsed.data.access_token
}

const googleProfileSchema = z.object({
  sub: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  email_verified: z.boolean().optional(),
})
const facebookProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
})
const tiktokProfileSchema = z.object({
  data: z.object({ user: z.object({ open_id: z.string().min(1), display_name: z.string().optional() }) }),
})

// Reads the signed-in person's profile with the token.
async function fetchProfile(provider: ProviderId, accessToken: string, fetchImpl: typeof fetch): Promise<OAuthProfile> {
  const bearer = { Authorization: `Bearer ${accessToken}` }
  if (provider === 'google') {
    const response = await fetchImpl('https://openidconnect.googleapis.com/v1/userinfo', { headers: bearer })
    const parsed = googleProfileSchema.safeParse(response.ok ? await response.json() : null)
    if (!parsed.success) {
      throw new OAuthError('gagal')
    }
    const data = parsed.data
    return {
      providerUserId: data.sub,
      name: data.name ?? 'Pengguna Google',
      email: data.email?.toLowerCase() ?? null,
      emailVerified: data.email_verified === true,
    }
  }
  if (provider === 'facebook') {
    const url = new URL('https://graph.facebook.com/v19.0/me')
    url.search = new URLSearchParams({ fields: 'id,name,email' }).toString()
    const response = await fetchImpl(url, { headers: bearer })
    const parsed = facebookProfileSchema.safeParse(response.ok ? await response.json() : null)
    if (!parsed.success) {
      throw new OAuthError('gagal')
    }
    const data = parsed.data
    // Facebook only shares an email it has confirmed for the account.
    return {
      providerUserId: data.id,
      name: data.name ?? 'Pengguna Facebook',
      email: data.email?.toLowerCase() ?? null,
      emailVerified: data.email !== undefined,
    }
  }
  const url = new URL('https://open.tiktokapis.com/v2/user/info/')
  url.search = new URLSearchParams({ fields: 'open_id,display_name' }).toString()
  const response = await fetchImpl(url, { headers: bearer })
  const parsed = tiktokProfileSchema.safeParse(response.ok ? await response.json() : null)
  if (!parsed.success) {
    throw new OAuthError('gagal')
  }
  // TikTok does not share an email with this sign-in, so the account gets a placeholder address.
  return {
    providerUserId: parsed.data.data.user.open_id,
    name: parsed.data.data.user.display_name ?? 'Pengguna TikTok',
    email: null,
    emailVerified: false,
  }
}

// Finds the account for this provider user. A known provider user signs in to the same account every time.
// A verified email that already has an account is linked to it. An unverified one is refused.
export async function linkOrCreateUser(provider: ProviderId, profile: OAuthProfile): Promise<string> {
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } },
  })
  if (linked) {
    await prisma.user.updateMany({ where: { id: linked.userId, deletionScheduledAt: { not: null } }, data: { deletionScheduledAt: null } })
    return linked.userId
  }

  let userId: string | null = null
  if (profile.email) {
    const existing = await prisma.user.findUnique({ where: { email: profile.email } })
    if (existing) {
      if (!profile.emailVerified) {
        throw new OAuthError('email-dipakai')
      }
      userId = existing.id
      if (existing.deletionScheduledAt) {
        await prisma.user.update({ where: { id: existing.id }, data: { deletionScheduledAt: null } })
      }
    }
  }
  if (!userId) {
    const email = profile.email ?? `${provider}-${profile.providerUserId}@oauth.teachtren.local`
    const user = await prisma.user.create({
      data: {
        name: profile.name.slice(0, 60),
        email,
        // Nobody signs in with this password. It only fills the required field.
        passwordHash: await hashPassword(randomBytes(32).toString('hex')),
      },
    })
    userId = user.id
  }
  await prisma.oAuthAccount.create({ data: { provider, providerUserId: profile.providerUserId, userId } })
  return userId
}

// The whole sign-in after the provider has sent the user back: code to token, token to profile, profile to account.
export async function completeOAuthSignIn(input: {
  provider: ProviderId
  settings: ProviderSettings
  code: string
  redirectUri: string
  fetchImpl: typeof fetch
}): Promise<string> {
  const token = await exchangeCode(input.provider, input.settings, input.code, input.redirectUri, input.fetchImpl)
  const profile = await fetchProfile(input.provider, token, input.fetchImpl)
  return linkOrCreateUser(input.provider, profile)
}

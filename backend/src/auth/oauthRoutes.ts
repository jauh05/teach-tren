import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import { config } from '../config/index.js'
import { authorizeUrl, callbackUrl, completeOAuthSignIn, isProviderId, OAuthError, providerSettings, type ProviderId } from './oauth.js'
import { issueSession } from './session.js'

// Routes for signing in with Google, Facebook, and TikTok. Mounted at /api/auth/oauth.
export const oauthRouter = Router()

// The state value ties the callback to the browser that started the sign-in, so a forged callback is refused.
const STATE_COOKIE = 'tt_oauth_state'
const STATE_MINUTES = 10
const STATE_PATH = '/api/auth/oauth'

// Where the browser goes after the sign-in. Failures come back to the sign-in page with a short reason.
function appUrl(): string {
  return config.OAUTH_BASE_URL ?? config.CORS_ORIGIN
}

function backToSignIn(provider: ProviderId, reason: string): string {
  return `${appUrl()}/masuk?oauth=${reason}&provider=${provider}`
}

oauthRouter.get('/:provider/start', (req, res) => {
  const provider = String(req.params.provider)
  if (!isProviderId(provider)) {
    res.status(404).json({ pesan: 'Penyedia masuk tidak dikenal.' })
    return
  }
  const settings = providerSettings(provider)
  if (!settings || !config.OAUTH_BASE_URL) {
    res.redirect(backToSignIn(provider, 'belum-tersedia'))
    return
  }
  const state = randomBytes(24).toString('base64url')
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.NODE_ENV === 'production',
    path: STATE_PATH,
    maxAge: STATE_MINUTES * 60 * 1000,
  })
  res.redirect(authorizeUrl(provider, settings, callbackUrl(config.OAUTH_BASE_URL, provider), state))
})

oauthRouter.get('/:provider/callback', async (req, res) => {
  const provider = String(req.params.provider)
  if (!isProviderId(provider)) {
    res.status(404).json({ pesan: 'Penyedia masuk tidak dikenal.' })
    return
  }
  const expectedState = req.cookies?.[STATE_COOKIE]
  res.clearCookie(STATE_COOKIE, { path: STATE_PATH })

  const settings = providerSettings(provider)
  if (!settings || !config.OAUTH_BASE_URL) {
    res.redirect(backToSignIn(provider, 'belum-tersedia'))
    return
  }
  // The user pressed cancel at the provider, or the provider refused.
  if (typeof req.query.error === 'string') {
    res.redirect(backToSignIn(provider, 'dibatalkan'))
    return
  }
  const { code, state } = req.query
  if (typeof code !== 'string' || typeof state !== 'string' || typeof expectedState !== 'string' || state !== expectedState) {
    res.redirect(backToSignIn(provider, 'gagal'))
    return
  }

  try {
    const userId = await completeOAuthSignIn({
      provider,
      settings,
      code,
      redirectUri: callbackUrl(config.OAUTH_BASE_URL, provider),
      fetchImpl: fetch,
    })
    await issueSession(res, userId)
    res.redirect(`${appUrl()}/chat`)
  } catch (error) {
    const reason = error instanceof OAuthError ? error.reason : 'gagal'
    res.redirect(backToSignIn(provider, reason))
  }
})

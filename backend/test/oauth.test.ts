import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { prisma } from '../src/db.js'
import { authorizeUrl, callbackUrl, completeOAuthSignIn, OAuthError, type ProviderId, type ProviderSettings } from '../src/auth/oauth.js'
import { createTestApp, registerAgent, resetDatabase } from './helpers.js'

const SETTINGS: ProviderSettings = { clientId: 'id-uji', clientSecret: 'rahasia-uji' }
const REDIRECT = 'http://localhost:5173/api/auth/oauth/google/callback'

// A fake provider: answers each address with the JSON it is given, and returns the status for failures.
function fakeProvider(answers: Record<string, { status?: number; body: unknown }>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const key = Object.keys(answers).find((prefix) => url.startsWith(prefix))
    if (!key) {
      throw new Error(`Alamat tidak diuji: ${url}`)
    }
    const { status = 200, body } = answers[key]
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
}

describe('alamat masuk penyedia', () => {
  it('Google meminta email dan profil, dan membawa state dan alamat balik', () => {
    const url = new URL(authorizeUrl('google', SETTINGS, REDIRECT, 'state-1'))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('client_id')).toBe('id-uji')
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT)
    expect(url.searchParams.get('scope')).toBe('openid email profile')
    expect(url.searchParams.get('state')).toBe('state-1')
  })

  it('TikTok memakai client_key, dan Facebook memakai client_id', () => {
    const tiktok = new URL(authorizeUrl('tiktok', SETTINGS, REDIRECT, 's'))
    expect(tiktok.searchParams.get('client_key')).toBe('id-uji')
    expect(tiktok.searchParams.get('scope')).toBe('user.info.basic')
    const facebook = new URL(authorizeUrl('facebook', SETTINGS, REDIRECT, 's'))
    expect(facebook.searchParams.get('client_id')).toBe('id-uji')
    expect(facebook.searchParams.get('scope')).toBe('email,public_profile')
  })

  it('alamat balik dibentuk dari alamat aplikasi, tanpa garis miring ganda', () => {
    expect(callbackUrl('http://localhost:5173/', 'tiktok')).toBe('http://localhost:5173/api/auth/oauth/tiktok/callback')
  })
})

describe('masuk dengan penyedia', () => {
  beforeEach(resetDatabase)

  it('Google yang sudah dihubungkan masuk ke akun yang sama setiap kali', async () => {
    const fetchImpl = fakeProvider({
      'https://oauth2.googleapis.com/token': { body: { access_token: 'token-1' } },
      'https://openidconnect.googleapis.com/v1/userinfo': {
        body: { sub: 'google-123', name: 'Rani Putri', email: 'rani@contoh.id', email_verified: true },
      },
    })
    const first = await completeOAuthSignIn({ provider: 'google', settings: SETTINGS, code: 'kode', redirectUri: REDIRECT, fetchImpl })
    const second = await completeOAuthSignIn({ provider: 'google', settings: SETTINGS, code: 'kode', redirectUri: REDIRECT, fetchImpl })
    expect(second).toBe(first)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: first } })
    expect(user.email).toBe('rani@contoh.id')
    const links = await prisma.oAuthAccount.findMany({ where: { userId: first } })
    expect(links).toHaveLength(1)
  })

  it('email Google yang sudah diverifikasi dihubungkan ke akun yang sudah ada', async () => {
    const existing = await registerAgent(createTestApp(), 'sudah-ada@contoh.id')
    const existingUser = await prisma.user.findUniqueOrThrow({ where: { email: 'sudah-ada@contoh.id' } })
    const fetchImpl = fakeProvider({
      'https://oauth2.googleapis.com/token': { body: { access_token: 't' } },
      'https://openidconnect.googleapis.com/v1/userinfo': {
        body: { sub: 'google-9', name: 'Siswa', email: 'sudah-ada@contoh.id', email_verified: true },
      },
    })
    expect(existing).toBeDefined()
    const userId = await completeOAuthSignIn({ provider: 'google', settings: SETTINGS, code: 'k', redirectUri: REDIRECT, fetchImpl })
    expect(userId).toBe(existingUser.id)
  })

  it('email yang belum diverifikasi tidak boleh masuk ke akun orang lain', async () => {
    await registerAgent(createTestApp(), 'milik-orang@contoh.id')
    const fetchImpl = fakeProvider({
      'https://oauth2.googleapis.com/token': { body: { access_token: 't' } },
      'https://openidconnect.googleapis.com/v1/userinfo': {
        body: { sub: 'google-7', name: 'Penipu', email: 'milik-orang@contoh.id', email_verified: false },
      },
    })
    await expect(completeOAuthSignIn({ provider: 'google', settings: SETTINGS, code: 'k', redirectUri: REDIRECT, fetchImpl })).rejects.toMatchObject({
      reason: 'email-dipakai',
    })
    expect(await prisma.oAuthAccount.count()).toBe(0)
  })

  it('TikTok tidak membagikan email, jadi akun dibuat dengan alamat sementara', async () => {
    const fetchImpl = fakeProvider({
      'https://open.tiktokapis.com/v2/oauth/token/': { body: { access_token: 't' } },
      'https://open.tiktokapis.com/v2/user/info/': { body: { data: { user: { open_id: 'tt-55', display_name: 'Dimas' } } } },
    })
    const userId = await completeOAuthSignIn({ provider: 'tiktok', settings: SETTINGS, code: 'k', redirectUri: REDIRECT, fetchImpl })
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.email).toBe('tiktok-tt-55@oauth.teachtren.local')
    expect(user.name).toBe('Dimas')
  })

  it('penukaran kode yang ditolak penyedia dihitung sebagai gagal', async () => {
    const fetchImpl = fakeProvider({
      'https://oauth2.googleapis.com/token': { status: 400, body: { error: 'invalid_grant' } },
    })
    await expect(completeOAuthSignIn({ provider: 'google', settings: SETTINGS, code: 'basi', redirectUri: REDIRECT, fetchImpl })).rejects.toBeInstanceOf(OAuthError)
  })
})

describe('rute masuk dengan penyedia saat belum dikonfigurasi', () => {
  const app = createTestApp()

  it('penyedia yang belum punya kunci kembali ke halaman masuk dengan pesan belum tersedia', async () => {
    const provider: ProviderId = 'google'
    const response = await request(app).get(`/api/auth/oauth/${provider}/start`).redirects(0)
    expect(response.status).toBe(302)
    expect(response.headers.location).toContain('/masuk?oauth=belum-tersedia&provider=google')
  })

  it('penyedia yang tidak dikenal ditolak', async () => {
    const response = await request(app).get('/api/auth/oauth/myspace/start')
    expect(response.status).toBe(404)
  })
})

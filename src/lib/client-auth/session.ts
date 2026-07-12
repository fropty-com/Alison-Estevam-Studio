import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

/**
 * Lightweight signed-cookie session for the client area — deliberately NOT
 * Supabase Auth. Supabase Auth is used only by the admin (email/password);
 * mixing the two caused the service-role/session interference bug fixed
 * alongside migration 009. A plain HMAC-signed cookie avoids that entirely
 * and needs no extra dependency.
 */

const COOKIE_NAME = 'ae_client_session'
const SESSION_DAYS = 30

function secret(): string {
  const s = process.env.CLIENT_SESSION_SECRET
  if (!s) throw new Error('CLIENT_SESSION_SECRET não configurado.')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export async function createClientSession(clientId: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = Buffer.from(JSON.stringify({ clientId, exp })).toString('base64url')
  const token = `${payload}.${sign(payload)}`

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function destroyClientSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getClientSession(): Promise<{ clientId: string } | null> {
  const cookieStore = await cookies()
  return readSessionToken(cookieStore.get(COOKIE_NAME)?.value)
}

/** Same verification, usable from middleware where `cookies()` isn't available. */
export function readSessionToken(token: string | undefined): { clientId: string } | null {
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { clientId: string; exp: number }
    if (Date.now() > data.exp) return null
    return { clientId: data.clientId }
  } catch {
    return null
  }
}

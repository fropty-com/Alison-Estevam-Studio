import { createHash, randomInt } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'

const CODE_LENGTH        = 6
const EXPIRY_MIN         = 5
const MAX_ATTEMPTS       = 5
const MIN_INTERVAL_SEC   = 45  // minimum gap between two requests for the same phone
const MAX_PER_HOUR       = 5   // hourly cap per phone

function hashCode(code: string, phone: string): string {
  return createHash('sha256').update(`${phone}:${code}`).digest('hex')
}

function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0')
}

/**
 * Provider abstraction per the product spec — swap the body of these two
 * once a real WhatsApp/SMS account exists. Never hardcode a provider here.
 */
async function sendOtpViaWhatsApp(phone: string, code: string): Promise<void> {
  console.log(`[OTP dev] WhatsApp ${phone}: código ${code}`)
}

async function sendOtpViaSms(phone: string, code: string): Promise<void> {
  console.log(`[OTP dev] SMS ${phone}: código ${code}`)
}

// Strictly NODE_ENV === 'development' (never just "no provider configured"):
// Vercel sets NODE_ENV='production' for BOTH preview and production
// deployments, so this only ever leaks the code on a developer's own
// machine running `npm run dev`. Until a real WhatsApp/SMS provider is
// wired into sendOtpViaWhatsApp/sendOtpViaSms above, phone login simply
// doesn't work on any deployed environment — that's the correct trade-off:
// leaking the verification code in the response is a full auth bypass
// (staff_members.phone numbers are not secret — e.g. the business's own
// public WhatsApp contact number is also a staff phone).
//
// OTP_DEBUG_LEAK is a deliberate, manually-toggled escape hatch for the
// owner to validate the phone-login flow in production before a real
// provider is wired up. It must be unset (or "false") the rest of the
// time — while set, ANY phone number's code is exposed in the response,
// including staff phones that grant admin access.
const DEV_MODE = process.env.NODE_ENV === 'development' || process.env.OTP_DEBUG_LEAK === 'true'

export async function requestOtp(phone: string): Promise<{ devCode?: string; error?: string }> {
  const db = await createServiceClient() as any

  // Rate limit per phone, enforced against otp_codes itself — no new infra.
  // Without this, MAX_ATTEMPTS above is meaningless: an attacker just calls
  // requestOtp again for a fresh row (attempts reset to 0) and keeps
  // guessing indefinitely. This also caps how often a real WhatsApp/SMS
  // provider would be billed to spam a single phone once one is wired up.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recent } = await db
    .from('otp_codes')
    .select('created_at')
    .eq('phone', phone)
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  const recentRows = (recent ?? []) as { created_at: string }[]
  if (recentRows.length > 0) {
    const secondsSinceLast = (Date.now() - new Date(recentRows[0].created_at).getTime()) / 1000
    if (secondsSinceLast < MIN_INTERVAL_SEC) {
      return { error: `Aguarde ${Math.ceil(MIN_INTERVAL_SEC - secondsSinceLast)}s antes de pedir um novo código.` }
    }
  }
  if (recentRows.length >= MAX_PER_HOUR) {
    return { error: 'Muitos pedidos de código. Tente novamente em 1 hora.' }
  }

  const code = generateCode()

  await db.from('otp_codes').insert({
    phone,
    code_hash: hashCode(code, phone),
    expires_at: new Date(Date.now() + EXPIRY_MIN * 60 * 1000).toISOString(),
  })

  await sendOtpViaWhatsApp(phone, code).catch(() => sendOtpViaSms(phone, code))

  // Dev mode (no provider configured): surface the code directly so the
  // flow is testable without a real WhatsApp/SMS account.
  return DEV_MODE ? { devCode: code } : {}
}

export async function verifyOtp(phone: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = await createServiceClient() as any

  const { data: row } = await db
    .from('otp_codes')
    .select('id, code_hash, expires_at, attempts, consumed_at')
    .eq('phone', phone)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!row) return { ok: false, error: 'Código não encontrado. Solicite um novo.' }
  if (new Date(row.expires_at) < new Date()) return { ok: false, error: 'Código expirado. Solicite um novo.' }
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, error: 'Muitas tentativas. Solicite um novo código.' }

  if (row.code_hash !== hashCode(code, phone)) {
    await db.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id)
    return { ok: false, error: 'Código incorreto.' }
  }

  await db.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id)
  return { ok: true }
}

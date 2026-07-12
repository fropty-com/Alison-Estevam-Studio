import { createHash, randomInt } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'

const CODE_LENGTH   = 6
const EXPIRY_MIN    = 5
const MAX_ATTEMPTS  = 5

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

const DEV_MODE = !process.env.WHATSAPP_OTP_PROVIDER

export async function requestOtp(phone: string): Promise<{ devCode?: string }> {
  const db = await createServiceClient() as any
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

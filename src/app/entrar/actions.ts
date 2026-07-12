'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { formatWhatsApp, isFullName } from '@/lib/utils'
import { requestOtp, verifyOtp } from '@/lib/client-auth/otp'
import { createClientSession } from '@/lib/client-auth/session'

export async function checkPhoneAction(phoneRaw: string): Promise<{ error: string; exists?: undefined; name?: undefined } | { error?: undefined; exists: boolean; name?: string }> {
  let phone: string
  try {
    phone = formatWhatsApp(phoneRaw)
  } catch {
    return { error: 'Informe um telefone válido (DDD + 9 dígitos).' }
  }

  const db = await createServiceClient() as any
  const [{ data: client }, { data: staff }] = await Promise.all([
    db.from('clients').select('id, name').eq('whatsapp', phone).maybeSingle(),
    db.from('staff_members').select('id, name').eq('phone', phone).maybeSingle(),
  ])

  return { exists: !!(client || staff), name: (client?.name ?? staff?.name) as string | undefined }
}

/**
 * Bridges a WhatsApp-OTP-verified staff phone into a real Supabase Auth
 * admin session, without a password: mint a one-time magic-link token via
 * the admin API, then redeem it through the cookie-aware SSR client so the
 * browser gets the same session cookies loginAction() would set. Only a
 * phone an owner explicitly registered on staff_members.phone can ever
 * reach this — clients can't self-promote.
 */
async function establishStaffSession(staffId: string): Promise<{ error?: string }> {
  const serviceDb = await createServiceClient() as any
  const { data: userData, error: userError } = await serviceDb.auth.admin.getUserById(staffId)
  if (userError || !userData?.user?.email) return { error: 'Erro ao acessar conta administrativa.' }

  const { data: linkData, error: linkError } = await serviceDb.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user.email,
  })
  if (linkError || !linkData?.properties?.hashed_token) return { error: 'Erro ao gerar sessão administrativa.' }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: linkData.properties.hashed_token,
  })
  if (verifyError) return { error: 'Erro ao autenticar. Tente novamente.' }

  return {}
}

export async function sendOtpAction(phoneRaw: string) {
  let phone: string
  try {
    phone = formatWhatsApp(phoneRaw)
  } catch {
    return { error: 'Informe um telefone válido (DDD + 9 dígitos).' }
  }
  const { devCode } = await requestOtp(phone)
  return { devCode }
}

export async function verifyAndLoginAction(input: {
  phoneRaw: string
  code: string
  name?: string
  consentWhatsapp?: boolean
  consentTerms?: boolean
}) {
  let phone: string
  try {
    phone = formatWhatsApp(input.phoneRaw)
  } catch {
    return { error: 'Informe um telefone válido (DDD + 9 dígitos).' }
  }
  const result = await verifyOtp(phone, input.code.trim())
  if (!result.ok) return { error: result.error }

  const db = await createServiceClient() as any

  // A registered staff phone always wins — routes straight into the admin
  // panel instead of the client account, no separate email/password needed.
  const { data: staff } = await db
    .from('staff_members')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (staff) {
    const sessionResult = await establishStaffSession(staff.id)
    if (sessionResult.error) return sessionResult
    redirect('/admin')
  }

  const { data: existing } = await db
    .from('clients')
    .select('id')
    .eq('whatsapp', phone)
    .maybeSingle()

  let clientId: string

  if (existing) {
    clientId = existing.id
    await db.from('clients').update({ last_login_at: new Date().toISOString() }).eq('id', clientId)
  } else {
    if (!input.name || !isFullName(input.name)) return { error: 'Informe nome e sobrenome.' }
    if (!input.consentTerms) return { error: 'É necessário aceitar os termos.' }

    const { data: created, error } = await db
      .from('clients')
      .insert({
        name: input.name.trim(),
        whatsapp: phone,
        consent_whatsapp: !!input.consentWhatsapp,
        consent_terms: true,
        last_login_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !created) return { error: 'Erro ao criar conta. Tente novamente.' }
    clientId = created.id
  }

  await createClientSession(clientId)
  redirect('/conta')
}

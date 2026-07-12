'use server'

import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { formatWhatsApp } from '@/lib/utils'
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
  const { data: client } = await db
    .from('clients')
    .select('id, name')
    .eq('whatsapp', phone)
    .maybeSingle()

  return { exists: !!client, name: client?.name as string | undefined }
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
    if (!input.name || input.name.trim().length < 2) return { error: 'Informe seu nome.' }
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

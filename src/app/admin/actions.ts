'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { todayInSaoPaulo } from '@/lib/timezone'
import { calculatePaymentBreakdown } from '@/lib/payments'
import { createManualAppointmentSchema, joinWaitlistSchema } from '@/lib/validations/booking'
import { formatWhatsApp, isFullName } from '@/lib/utils'
import { sendConfirmationEmail } from '@/lib/email/confirmation'
import { ensureSlotsForDate } from '@/lib/schedule/ensureSlots'
import { SLOT_STATUS } from '@/config/booking'
import { isStaffMember, establishStaffSession } from '@/lib/admin-auth'
import { verifyOtp } from '@/lib/client-auth/otp'
import type { Database, Json, TablesUpdate } from '@/types/database'

async function adminDb() {
  // Service-role client — bypasses RLS, server-only
  const { createClient } = await import('@supabase/supabase-js')
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSessionUser() {
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  // Being authenticated alone is not enough — only staff_members rows may
  // call admin Server Actions (see src/lib/admin-auth.ts for the same gate
  // applied at the middleware level).
  if (!(await isStaffMember(user.id))) return null
  return user
}

/**
 * Confirms the logged-in admin is an owner. Team-management actions are only
 * hidden from staff in the UI — that's not a security boundary, since server
 * actions can be called directly — so this is the real gate.
 */
async function requireOwner(): Promise<{ error: string } | null> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { data } = await db.from('staff_members').select('role').eq('id', user.id).maybeSingle()
  if (data?.role !== 'owner') return { error: 'Apenas donos podem gerenciar a equipe.' }
  return null
}

/**
 * Records a sensitive admin action to audit_log: who did what, to which
 * record, with a human-readable summary. Never throws — a logging failure
 * must not break the action it's attached to, so this is best-effort.
 */
async function logAction(
  action: string,
  targetType: string,
  targetId: string | null,
  summary: string,
  metadata?: Record<string, unknown>
) {
  try {
    const user = await getSessionUser()
    if (!user) return
    const db = await adminDb()
    const { data: staff } = await db.from('staff_members').select('name').eq('id', user.id).maybeSingle()
    await db.from('audit_log').insert({
      actor_id: user.id,
      actor_name: staff?.name ?? user.email ?? 'Desconhecido',
      action,
      target_type: targetType,
      target_id: targetId,
      summary,
      metadata: (metadata as Json) ?? null,
    })
  } catch {
    // best-effort — see doc comment above
  }
}

/* ── Auth ─────────────────────────────────────── */

export async function loginAction(formData: FormData) {
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string

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

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'E-mail ou senha incorretos.' }

  redirect('/admin')
}

/**
 * Whether a phone is registered on staff_members — checked before sending
 * an OTP from the login screen's phone tab, so a number with no admin
 * access doesn't get a WhatsApp code for nothing.
 */
export async function checkStaffPhoneAction(phoneRaw: string): Promise<{ error: string; exists?: undefined } | { error?: undefined; exists: boolean }> {
  let phone: string
  try {
    phone = formatWhatsApp(phoneRaw)
  } catch {
    return { error: 'Informe um telefone válido (DDD + 9 dígitos).' }
  }

  const db = await adminDb()
  const { data: staff } = await db.from('staff_members').select('id').eq('phone', phone).maybeSingle()
  if (!staff) return { error: 'Este telefone não tem acesso ao painel administrativo.' }
  return { exists: true }
}

/**
 * Verifies the WhatsApp OTP and bridges straight into an admin session —
 * unlike /entrar's verifyAndLoginAction, this never falls back to creating
 * a client account: a phone that isn't on staff_members is always an error.
 */
export async function verifyStaffPhoneLoginAction(input: { phoneRaw: string; code: string }): Promise<{ error?: string }> {
  let phone: string
  try {
    phone = formatWhatsApp(input.phoneRaw)
  } catch {
    return { error: 'Informe um telefone válido (DDD + 9 dígitos).' }
  }

  const result = await verifyOtp(phone, input.code.trim())
  if (!result.ok) return { error: result.error }

  const db = await adminDb()
  const { data: staff } = await db.from('staff_members').select('id').eq('phone', phone).maybeSingle()
  if (!staff) return { error: 'Este telefone não tem acesso ao painel administrativo.' }

  const sessionResult = await establishStaffSession(staff.id)
  if (sessionResult.error) return sessionResult

  redirect('/admin')
}

export async function logoutAction() {
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
  await supabase.auth.signOut()
  redirect('/admin/login')
}

/* ── Appointments ─────────────────────────────── */

export async function updateAppointmentStatus(id: string, status: string, reason?: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const update: TablesUpdate<'appointments'> = { status, updated_at: new Date().toISOString() }
  if (status === 'cancelled') {
    update.cancelled_at = new Date().toISOString()
    if (reason) update.cancellation_reason = reason
  }

  const { data: appt, error } = await db.from('appointments').update(update).eq('id', id).select('slot_id, reference_code').single()
  if (error) return { error: 'Erro ao atualizar agendamento.' }

  // A cancellation must free the slot for other clients — the public
  // /cancelar flow already did this, but a cancellation made from the admin
  // panel silently left the slot marked booked forever.
  if (status === 'cancelled' && appt?.slot_id) {
    await db.from('time_slots').update({ status: 'available' }).eq('id', appt.slot_id)
  }

  const statusLabel: Record<string, string> = {
    confirmed: 'confirmou', cancelled: 'cancelou', no_show: 'marcou como não compareceu',
  }
  await logAction(
    'appointment.status_change', 'appointment', id,
    `${statusLabel[status] ?? `mudou status para ${status} em`} agendamento #${appt?.reference_code ?? id}${reason ? ` (motivo: ${reason})` : ''}`,
    { status, reason }
  )

  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
  return { ok: true }
}

/* ── Waitlist ─────────────────────────────────── */

export async function updateWaitlistStatus(id: string, status: 'notified' | 'resolved' | 'cancelled'): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const update: TablesUpdate<'waitlist_entries'> = { status }
  if (status === 'notified') update.notified_at = new Date().toISOString()

  const { error } = await db.from('waitlist_entries').update(update).eq('id', id)
  if (error) return { error: 'Erro ao atualizar fila de espera.' }

  revalidatePath('/admin/espera')
  return { ok: true }
}

/**
 * Registers a client on the waitlist from the admin panel (e.g. a phone
 * request). Mirrors POST /api/waitlist's find-or-create-client logic, but
 * as an authenticated admin action with an audit log entry.
 */
export async function createManualWaitlistEntry(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const parsed = joinWaitlistSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }
  const { name, whatsapp, serviceId, preferredDate, note } = parsed.data

  const db = await adminDb()

  const { data: service } = await db
    .from('services')
    .select('id')
    .eq('id', serviceId)
    .eq('active', true)
    .maybeSingle()
  if (!service) return { error: 'Serviço não encontrado.' }

  const formattedWhatsapp = formatWhatsApp(whatsapp)
  let clientId: string

  const { data: existingClient } = await db
    .from('clients')
    .select('id')
    .eq('whatsapp', formattedWhatsapp)
    .maybeSingle()

  if (existingClient) {
    clientId = existingClient.id
    await db.from('clients').update({ name }).eq('id', clientId)
  } else {
    const { data: newClient, error: clientError } = await db
      .from('clients')
      .insert({ name, whatsapp: formattedWhatsapp })
      .select('id')
      .single()
    if (clientError || !newClient) return { error: 'Erro ao registrar cliente.' }
    clientId = newClient.id
  }

  const { error: waitlistError } = await db.from('waitlist_entries').insert({
    client_id: clientId,
    service_id: serviceId,
    preferred_date: preferredDate,
    note: note || null,
  })
  if (waitlistError) return { error: 'Erro ao adicionar à fila de espera.' }

  await logAction(
    'waitlist.manual_add', 'client', clientId,
    `Adicionou ${name} à fila de espera`,
    { serviceId, preferredDate }
  )

  revalidatePath('/admin/espera')
  return { ok: true }
}

export async function checkInAppointment(id: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db.from('appointments').update({
    status: 'checked_in',
    checked_in_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: 'Erro ao registrar check-in.' }

  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
  return { ok: true }
}

export async function checkOutAppointment(id: string, data: {
  method: 'cash' | 'pix' | 'debit_card' | 'credit_card' | 'courtesy'
  grossAmount: number
  discount: number
  tipAmount?: number
}) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()

  const { data: fee } = await db
    .from('payment_fee_settings')
    .select('fee_percentage')
    .eq('method', data.method)
    .single()

  const feePercentage = fee?.fee_percentage ?? 0
  const tipAmount = Math.max(0, data.tipAmount ?? 0)
  const { feeAmount, netAmount } = calculatePaymentBreakdown({
    grossAmount: data.grossAmount,
    discount: data.discount,
    feePercentage,
    tipAmount,
  })

  const now = new Date().toISOString()

  const [{ data: apptUpdated, error: apptError }, { error: paymentError }] = await Promise.all([
    db.from('appointments').update({
      status: 'completed',
      checked_out_at: now,
      discount: data.discount,
      updated_at: now,
    }).eq('id', id).select('reference_code').single(),
    db.from('payments').insert({
      appointment_id: id,
      method: data.method,
      gross_amount: data.grossAmount,
      fee_percentage: feePercentage,
      fee_amount: feeAmount,
      tip_amount: tipAmount,
      net_amount: netAmount,
      paid_at: now,
    }),
  ])

  if (apptError || paymentError) return { error: 'Erro ao registrar pagamento.' }

  await logAction(
    'appointment.checkout', 'appointment', id,
    `Registrou pagamento de R$ ${netAmount.toFixed(2)} (líquido) via ${data.method} no agendamento #${apptUpdated?.reference_code ?? id}`,
    { method: data.method, grossAmount: data.grossAmount, discount: data.discount, tipAmount, feeAmount, netAmount }
  )

  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
  return { ok: true }
}

export async function refundPayment(paymentId: string, reason: string): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const trimmedReason = reason.trim()
  if (!trimmedReason) return { error: 'Informe o motivo do estorno.' }

  const db = await adminDb()
  const { data: payment } = await db
    .from('payments')
    .select('id, net_amount, refunded_at')
    .eq('id', paymentId)
    .maybeSingle()
  if (!payment) return { error: 'Pagamento não encontrado.' }
  if (payment.refunded_at) return { error: 'Este pagamento já foi estornado.' }

  const { error } = await db
    .from('payments')
    .update({ refunded_at: new Date().toISOString(), refund_reason: trimmedReason })
    .eq('id', paymentId)
  if (error) return { error: 'Erro ao estornar pagamento.' }

  await logAction(
    'payment.refund', 'payment', paymentId,
    `Estornou pagamento de R$ ${Number(payment.net_amount).toFixed(2)} (${trimmedReason})`,
    { reason: trimmedReason }
  )

  revalidatePath('/admin')
  revalidatePath('/admin/faturamento')
  revalidatePath('/admin/financeiro')
  return { ok: true }
}

export async function addAppointmentNote(id: string, notes: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db.from('appointments').update({ notes }).eq('id', id)
  if (error) return { error: 'Erro ao salvar nota.' }

  revalidatePath('/admin/agenda')
  return { ok: true }
}

/**
 * Registers a walk-in / phone booking directly from the admin agenda.
 * Mirrors POST /api/appointments (slot/service/complement validation,
 * find-or-create client by WhatsApp, reference code via sequence, slot
 * booking, complement linking, confirmation email) but — unlike the public
 * route — allows the WhatsApp-only service (the admin is documenting a
 * time already arranged off-platform, not letting a client self-book it)
 * and accepts an internal note at creation time. No coupon: doesn't apply
 * to a manually-registered appointment.
 */
export async function createManualAppointment(input: unknown): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const parsed = createManualAppointmentSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }
  const { name, whatsapp, email, serviceId, slotId, complementIds, notes } = parsed.data

  const db = await adminDb()

  const { data: slot, error: slotError } = await db
    .from('time_slots')
    .select('id, status, date, start_time')
    .eq('id', slotId)
    .eq('status', 'available')
    .single()
  if (slotError || !slot) return { error: 'Este horário não está mais disponível.' }

  const { data: service, error: serviceError } = await db
    .from('services')
    .select('id, name, price')
    .eq('id', serviceId)
    .eq('active', true)
    .single()
  if (serviceError || !service) return { error: 'Serviço não encontrado.' }

  let complements: { id: string; name: string; price: number | null }[] = []
  if (complementIds.length > 0) {
    const { data: validComplements } = await db
      .from('service_complements')
      .select('complements(id, name, price, active)')
      .eq('service_id', serviceId)
      .in('complement_id', complementIds)

    complements = ((validComplements ?? []) as { complements: { id: string; name: string; price: number | null; active: boolean } | null }[])
      .map(row => row.complements)
      .filter((c): c is { id: string; name: string; price: number | null; active: boolean } => c !== null && c.active)

    if (complements.length !== complementIds.length) {
      return { error: 'Um ou mais complementos selecionados não estão disponíveis para este serviço.' }
    }
  }

  const complementsPrice = complements.reduce((sum, c) => sum + Number(c.price), 0)
  const totalPrice = Number(service.price) + complementsPrice

  const formattedWhatsapp = formatWhatsApp(whatsapp)
  let clientId: string

  const { data: existingClient } = await db
    .from('clients')
    .select('id')
    .eq('whatsapp', formattedWhatsapp)
    .maybeSingle()

  if (existingClient) {
    clientId = existingClient.id
    await db.from('clients').update({ name, ...(email && { email }) }).eq('id', clientId)
  } else {
    const { data: newClient, error: clientError } = await db
      .from('clients')
      .insert({ name, whatsapp: formattedWhatsapp, email: email || null })
      .select('id')
      .single()
    if (clientError || !newClient) return { error: 'Erro ao registrar cliente.' }
    clientId = newClient.id
  }

  const { data: referenceCode, error: refError } = await db.rpc('next_appointment_reference')
  if (refError || !referenceCode) return { error: 'Erro ao gerar código do agendamento.' }

  const [{ data: appt, error: apptError }, { error: slotUpdateError }] = await Promise.all([
    db.from('appointments').insert({
      reference_code:    referenceCode,
      client_id:         clientId,
      service_id:        serviceId,
      slot_id:           slotId,
      status:            'pending',
      service_price:     service.price,
      complements_price: complementsPrice,
      total_price:       totalPrice,
      notes:             notes || null,
      source:            'presencial',
    }).select('id').single(),
    db.from('time_slots').update({ status: 'booked' }).eq('id', slotId),
  ])

  if (apptError || slotUpdateError || !appt) return { error: 'Erro ao criar agendamento. Tente novamente.' }

  if (complements.length > 0) {
    await db.from('appointment_complements').insert(
      complements.map(c => ({ appointment_id: appt.id, complement_id: c.id, price: c.price }))
    )
  }

  if (email) {
    sendConfirmationEmail({
      clientName:    name,
      clientEmail:   email,
      serviceName:   service.name,
      date:          slot.date,
      startTime:     (slot.start_time as string).substring(0, 5),
      referenceCode,
    })
  }

  await logAction(
    'appointment.manual_create', 'appointment', appt.id,
    `Criou agendamento manual #${referenceCode} para ${name} (${service.name})`,
    { serviceId, slotId, complementIds }
  )

  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
  return { ok: true }
}

/* ── Clients ──────────────────────────────────── */

export async function updateClientNotes(id: string, notes: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db.from('clients').update({ notes, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erro ao salvar nota.' }

  revalidatePath(`/admin/clientes/${id}`)
  return { ok: true }
}

export async function toggleClientVip(id: string, vip: boolean) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db.from('clients').update({ vip, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: 'Erro ao atualizar status VIP.' }

  revalidatePath('/admin/clientes')
  revalidatePath(`/admin/clientes/${id}`)
  return { ok: true }
}

export async function updateClientProfile(
  id: string,
  data: { name: string; whatsapp: string; email: string; birthDate?: string }
) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const name = data.name.trim()
  if (!name) return { error: 'Informe o nome do cliente.' }

  let whatsapp: string
  try {
    whatsapp = formatWhatsApp(data.whatsapp)
  } catch {
    return { error: 'WhatsApp inválido. Informe o DDD + 9 dígitos.' }
  }

  const email = data.email.trim() || null
  const birthDate = data.birthDate?.trim() || null

  const db = await adminDb()

  const { data: conflict } = await db
    .from('clients')
    .select('id')
    .eq('whatsapp', whatsapp)
    .neq('id', id)
    .maybeSingle()
  if (conflict) return { error: 'Já existe outro cliente com esse WhatsApp.' }

  const { error } = await db
    .from('clients')
    .update({ name, whatsapp, email, birth_date: birthDate, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: 'Erro ao salvar dados do cliente.' }

  revalidatePath('/admin/clientes')
  revalidatePath(`/admin/clientes/${id}`)
  return { ok: true }
}

/* ── Services ─────────────────────────────────── */

export async function updateService(id: string, data: { name?: string; price?: number; duration?: number; active?: boolean }) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { data: before } = await db.from('services').select('name, price, duration, active').eq('id', id).maybeSingle()

  const { error } = await db.from('services').update(data).eq('id', id)
  if (error) return { error: 'Erro ao atualizar serviço.' }

  if (before && data.price !== undefined && Number(data.price) !== Number(before.price)) {
    await logAction(
      'service.price_change', 'service', id,
      `Alterou o preço de "${before.name}" de R$ ${before.price} para R$ ${data.price}`,
      { from: before.price, to: data.price }
    )
  } else if (before) {
    await logAction('service.update', 'service', id, `Editou o serviço "${before.name}"`, { before, after: data })
  }

  revalidatePath('/admin/servicos')
  return { ok: true }
}

export async function createService(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const name        = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const duration     = Number(formData.get('duration'))
  const price        = Number(formData.get('price'))
  const hiddenFromList = formData.get('hidden_from_list') === 'on'

  if (!name) return { error: 'Nome é obrigatório.' }
  if (!Number.isFinite(duration) || duration <= 0) return { error: 'Duração inválida.' }
  if (!Number.isFinite(price) || price < 0) return { error: 'Valor inválido.' }

  const slugBase = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const db = await adminDb()

  const { data: existingSlugs } = await db.from('services').select('slug').ilike('slug', `${slugBase}%`)
  const takenSlugs = new Set(((existingSlugs ?? []) as { slug: string }[]).map(s => s.slug))
  let slug = slugBase
  let suffix = 2
  while (takenSlugs.has(slug)) { slug = `${slugBase}-${suffix}`; suffix++ }

  const { data: maxPos } = await db.from('services').select('position').order('position', { ascending: false }).limit(1).maybeSingle()
  const position = (maxPos?.position ?? 0) + 1

  const { data: created, error } = await db
    .from('services')
    .insert({
      name, slug, description: description || null, duration, price,
      hidden_from_list: hiddenFromList, active: true, position,
    })
    .select('id')
    .single()
  if (error) return { error: 'Erro ao criar serviço.' }

  await logAction('service.create', 'service', created?.id ?? null, `Criou o serviço "${name}"`, { name, duration, price, hiddenFromList })

  revalidatePath('/admin/servicos')
  return { ok: true }
}

export async function deleteService(id: string): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const db = await adminDb()

  const { count } = await db.from('appointments').select('id', { count: 'exact', head: true }).eq('service_id', id)
  if ((count ?? 0) > 0) return { error: 'Este serviço já tem agendamentos e não pode ser excluído — desative-o em vez disso.' }

  const { data: service } = await db.from('services').select('name').eq('id', id).maybeSingle()

  await db.from('service_complements').delete().eq('service_id', id)
  const { error } = await db.from('services').delete().eq('id', id)
  if (error) return { error: 'Erro ao excluir serviço.' }

  await logAction('service.delete', 'service', id, `Excluiu o serviço "${service?.name ?? id}"`)

  revalidatePath('/admin/servicos')
  return { ok: true }
}

/* ── Blocked Periods ──────────────────────────── */

export async function addBlockedPeriod(formData: FormData) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const date_start = formData.get('date_start') as string
  const date_end   = formData.get('date_end')   as string
  const reason     = formData.get('reason')     as string

  if (!date_start || !date_end) return { error: 'Datas são obrigatórias.' }
  if (date_start > date_end)    return { error: 'Data de início deve ser antes do fim.' }

  const db = await adminDb()
  const { data: newPeriod, error } = await db
    .from('blocked_periods')
    .insert({ date_start, date_end, reason: reason || null })
    .select('id')
    .single()
  if (error || !newPeriod) return { error: 'Erro ao bloquear período.' }

  // Also mark existing available slots as blocked, tagged with this period
  // so removeBlockedPeriod later restores only the slots it itself blocked
  // (not ones a manual time-range block put there for an unrelated reason).
  await db.from('time_slots')
    .update({ status: 'blocked', blocked_period_id: newPeriod.id })
    .gte('date', date_start)
    .lte('date', date_end)
    .eq('status', 'available')

  await logAction(
    'blocked_period.add', 'blocked_period', null,
    `Bloqueou o período de ${date_start} a ${date_end}${reason ? ` (${reason})` : ''}`,
    { date_start, date_end, reason }
  )

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function removeBlockedPeriod(id: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()

  // Get the period first to restore slots
  const { data: period } = await db.from('blocked_periods').select('date_start, date_end').eq('id', id).single()

  // Capture exactly which slots THIS period blocked before deleting it —
  // once deleted, the FK (on delete set null) clears blocked_period_id on
  // them, so this has to happen first. Restoring by this id instead of by
  // date range + status='blocked' is what keeps a manual block (blocked_
  // period_id null) in that same range from being reopened by accident.
  const { data: blockedSlots } = await db
    .from('time_slots')
    .select('id')
    .eq('blocked_period_id', id)

  await db.from('blocked_periods').delete().eq('id', id)

  const slotIds = (blockedSlots ?? []).map((s: { id: string }) => s.id)
  if (slotIds.length > 0) {
    await db.from('time_slots')
      .update({ status: 'available', blocked_period_id: null })
      .in('id', slotIds)
  }

  if (period) {
    await logAction(
      'blocked_period.remove', 'blocked_period', id,
      `Removeu o bloqueio do período de ${period.date_start} a ${period.date_end}`,
      period
    )
  }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

/* ── Availability Rules ───────────────────────── */

export async function updateAvailabilityRule(id: string, data: { start_time?: string; end_time?: string; active?: boolean }) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { data: before } = await db.from('availability_rules').select('weekday, start_time, end_time, active').eq('id', id).maybeSingle()

  const { error } = await db.from('availability_rules').update(data).eq('id', id)
  if (error) return { error: 'Erro ao atualizar regra.' }

  const WEEKDAY = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  await logAction(
    'availability_rule.update', 'availability_rule', id,
    `Alterou horário de funcionamento de ${WEEKDAY[before?.weekday ?? -1] ?? 'um dia'}`,
    { before, after: data }
  )

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

/* ── Time range blocking (agenda shortcut) ────── */

export async function blockTimeRange(
  date: string,
  startTime: string,
  endTime: string,
  reason?: string,
  confirmed?: boolean
): Promise<{ ok?: boolean; error?: string; needsConfirm?: boolean; count?: number }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  if (!date || !startTime || !endTime || startTime >= endTime) {
    return { error: 'Faixa de horário inválida.' }
  }

  const db = await adminDb()
  await ensureSlotsForDate(db, date)

  const { data: existing } = await db
    .from('time_slots')
    .select('id')
    .eq('date', date)
    .gte('start_time', startTime)
    .lt('start_time', endTime)

  if ((existing ?? []).length === 0) {
    return { error: 'Não há horário de expediente nessa faixa (pode cair num intervalo entre janelas do dia).' }
  }

  const { data: conflicting } = await db
    .from('appointments')
    .select('id, time_slots!inner(date, start_time)')
    .in('status', ['pending', 'confirmed'])
    .eq('time_slots.date', date)
    .gte('time_slots.start_time', startTime)
    .lt('time_slots.start_time', endTime)

  const count = (conflicting ?? []).length
  if (count > 0 && !confirmed) {
    return { needsConfirm: true, count }
  }

  const { error } = await db
    .from('time_slots')
    .update({ status: SLOT_STATUS.BLOCKED })
    .eq('date', date)
    .eq('status', SLOT_STATUS.AVAILABLE)
    .gte('start_time', startTime)
    .lt('start_time', endTime)

  if (error) return { error: 'Erro ao bloquear horário.' }

  await logAction(
    'time_range.block', 'time_slot', null,
    `Bloqueou o horário de ${startTime} a ${endTime} em ${date}${reason ? ` (${reason})` : ''}`,
    { date, startTime, endTime, reason }
  )

  revalidatePath('/admin/agenda')
  return { ok: true }
}

export async function unblockTimeRange(date: string, startTime: string, endTime: string): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db
    .from('time_slots')
    .update({ status: SLOT_STATUS.AVAILABLE })
    .eq('date', date)
    .eq('status', SLOT_STATUS.BLOCKED)
    // Only touch manual blocks (blocked_period_id null) — a slot blocked as
    // part of a whole-day-off must only ever be reopened by removing that
    // day-off, or the two would drift out of sync with each other.
    .is('blocked_period_id', null)
    .gte('start_time', startTime)
    .lt('start_time', endTime)

  if (error) return { error: 'Erro ao desbloquear horário.' }

  await logAction(
    'time_range.unblock', 'time_slot', null,
    `Desbloqueou o horário de ${startTime} a ${endTime} em ${date}`,
    { date, startTime, endTime }
  )

  revalidatePath('/admin/agenda')
  return { ok: true }
}

/* ── Payment Fee Settings ─────────────────────── */

export async function updatePaymentFeeSetting(id: string, data: { fee_percentage?: number; active?: boolean; pix_key?: string | null }) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  if (data.fee_percentage !== undefined && (isNaN(data.fee_percentage) || data.fee_percentage < 0 || data.fee_percentage > 100)) {
    return { error: 'Taxa inválida.' }
  }

  const db = await adminDb()
  const { data: before } = await db.from('payment_fee_settings').select('method, fee_percentage').eq('id', id).maybeSingle()

  const { error } = await db.from('payment_fee_settings').update(data).eq('id', id)
  if (error) return { error: 'Erro ao atualizar taxa.' }

  if (before && data.fee_percentage !== undefined) {
    await logAction(
      'payment_fee.update', 'payment_fee_setting', id,
      `Alterou a taxa de ${before.method} de ${before.fee_percentage}% para ${data.fee_percentage}%`,
      { method: before.method, from: before.fee_percentage, to: data.fee_percentage }
    )
  }

  revalidatePath('/admin/configuracoes')
  revalidatePath('/admin/relatorios')
  return { ok: true }
}

/* ── Team / Roles ─────────────────────────────── */

export async function addStaffMember(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const email    = (formData.get('email')    as string)?.trim()
  const name     = (formData.get('name')     as string)?.trim()
  const password = formData.get('password')  as string
  const role     = formData.get('role')      as string

  if (!email || !name)              return { error: 'Preencha nome e e-mail.' }
  if (!password || password.length < 8) return { error: 'Senha precisa ter pelo menos 8 caracteres.' }
  if (role !== 'owner' && role !== 'staff') return { error: 'Papel inválido.' }

  const db = await adminDb()

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createError || !created?.user) {
    const alreadyExists = createError?.message?.toLowerCase().includes('already')
    return { error: alreadyExists ? 'Já existe uma conta com esse e-mail.' : 'Erro ao criar conta.' }
  }

  const { error: insertError } = await db.from('staff_members').insert({
    id: created.user.id, name, role,
  })
  if (insertError) {
    await db.auth.admin.deleteUser(created.user.id)
    return { error: 'Erro ao registrar membro da equipe.' }
  }

  await logAction('staff.add', 'staff_member', created.user.id, `Adicionou ${name} à equipe como ${role === 'owner' ? 'proprietário' : 'funcionário'}`, { email, role })

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updateStaffRole(id: string, role: 'owner' | 'staff') {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const db = await adminDb()

  if (role === 'staff') {
    const guardError = await ensureNotLastOwner(db, id)
    if (guardError) return guardError
  }

  const { data: member } = await db.from('staff_members').select('name').eq('id', id).maybeSingle()
  const { error } = await db.from('staff_members').update({ role }).eq('id', id)
  if (error) return { error: 'Erro ao atualizar papel.' }

  await logAction('staff.role_change', 'staff_member', id, `Mudou o papel de ${member?.name ?? id} para ${role === 'owner' ? 'proprietário' : 'funcionário'}`, { role })

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function removeStaffMember(id: string) {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const db = await adminDb()

  const guardError = await ensureNotLastOwner(db, id)
  if (guardError) return guardError

  const { data: member } = await db.from('staff_members').select('name').eq('id', id).maybeSingle()

  // Deletes the Supabase Auth account; staff_members row cascades via FK.
  const { error } = await db.auth.admin.deleteUser(id)
  if (error) return { error: 'Erro ao remover membro.' }

  await logAction('staff.remove', 'staff_member', id, `Removeu ${member?.name ?? id} da equipe`)

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

/** Blocks demoting/removing a member if they're the last remaining owner. */
async function ensureNotLastOwner(db: Awaited<ReturnType<typeof adminDb>>, id: string): Promise<{ error: string } | null> {
  const { data: current } = await db.from('staff_members').select('role').eq('id', id).single()
  if (current?.role !== 'owner') return null

  const { count } = await db.from('staff_members').select('id', { count: 'exact', head: true }).eq('role', 'owner')
  if ((count ?? 0) <= 1) return { error: 'Precisa existir pelo menos um dono na equipe.' }
  return null
}

/* ── Loyalty Program ──────────────────────────── */

export async function updateLoyaltySettings(data: { visits_required?: number; reward_description?: string }): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  if (data.visits_required !== undefined && (!Number.isInteger(data.visits_required) || data.visits_required < 1)) {
    return { error: 'Número de visitas inválido.' }
  }
  if (data.reward_description !== undefined && data.reward_description.trim().length === 0) {
    return { error: 'Descreva a recompensa.' }
  }

  const db = await adminDb()
  const { data: settings } = await db.from('loyalty_settings').select('id').eq('active', true).limit(1).maybeSingle()
  if (!settings) return { error: 'Configuração de fidelidade não encontrada.' }

  const { error } = await db.from('loyalty_settings').update({ ...data, updated_at: new Date().toISOString() }).eq('id', settings.id)
  if (error) return { error: 'Erro ao atualizar programa de fidelidade.' }

  await logAction('loyalty.settings_update', 'loyalty_settings', settings.id, 'Alterou as regras do programa de fidelidade', data)

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function redeemLoyaltyReward(clientId: string) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const { getLoyaltyProgress } = await import('@/lib/loyalty')
  const db = await adminDb()
  const progress = await getLoyaltyProgress(db, clientId)
  if (progress.availableRewards < 1) return { error: 'Este cliente ainda não tem recompensa disponível.' }

  const { error } = await db.from('loyalty_redemptions').insert({ client_id: clientId, redeemed_by: user.id })
  if (error) return { error: 'Erro ao registrar resgate.' }

  const { data: client } = await db.from('clients').select('name').eq('id', clientId).maybeSingle()
  await logAction('loyalty.redeem', 'client', clientId, `Resgatou recompensa de fidelidade para ${client?.name ?? clientId}`)

  revalidatePath(`/admin/clientes/${clientId}`)
  return { ok: true }
}

/* ── Coupons ──────────────────────────────────── */

export async function addCoupon(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const code         = (formData.get('code') as string)?.trim().toUpperCase()
  const discountType = formData.get('discount_type') as string
  const discountValue = Number(formData.get('discount_value'))
  const maxUsesRaw    = (formData.get('max_uses') as string)?.trim()
  const expiresAtRaw  = (formData.get('expires_at') as string)?.trim()

  if (!code) return { error: 'Informe um código.' }
  if (discountType !== 'percentage' && discountType !== 'fixed') return { error: 'Tipo de desconto inválido.' }
  if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: 'Valor de desconto inválido.' }
  if (discountType === 'percentage' && discountValue > 100) return { error: 'Percentual não pode passar de 100.' }

  const maxUses = maxUsesRaw ? parseInt(maxUsesRaw, 10) : null
  if (maxUsesRaw && (!Number.isInteger(maxUses) || (maxUses as number) < 1)) return { error: 'Limite de usos inválido.' }

  const db = await adminDb()
  const { data: created, error } = await db.from('coupons').insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    max_uses: maxUses,
    expires_at: expiresAtRaw || null,
  }).select('id').single()
  if (error) {
    const duplicate = error.message?.toLowerCase().includes('duplicate')
    return { error: duplicate ? 'Já existe um cupom com esse código.' : 'Erro ao criar cupom.' }
  }

  await logAction(
    'coupon.create', 'coupon', created?.id ?? null,
    `Criou o cupom ${code} (${discountType === 'percentage' ? `${discountValue}%` : `R$ ${discountValue}`})`,
    { code, discountType, discountValue, maxUses, expiresAt: expiresAtRaw || null }
  )

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function toggleCouponActive(id: string, active: boolean): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const db = await adminDb()
  const { data: coupon } = await db.from('coupons').select('code').eq('id', id).maybeSingle()
  const { error } = await db.from('coupons').update({ active }).eq('id', id)
  if (error) return { error: 'Erro ao atualizar cupom.' }

  await logAction('coupon.toggle', 'coupon', id, `${active ? 'Ativou' : 'Desativou'} o cupom ${coupon?.code ?? id}`, { active })

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function createExpense(formData: FormData): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const description = (formData.get('description') as string)?.trim()
  const category     = (formData.get('category') as string)?.trim()
  const amount       = Number(formData.get('amount'))
  const isFixed      = formData.get('is_fixed') === 'on'
  const dueDate       = formData.get('due_date') as string
  const paidNow       = formData.get('paid_now') === 'on'

  if (!description) return { error: 'Descrição é obrigatória.' }
  if (!category) return { error: 'Categoria é obrigatória.' }
  if (!dueDate) return { error: 'Data de vencimento é obrigatória.' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Valor inválido.' }

  const db = await adminDb()
  const { data: created, error } = await db
    .from('expenses')
    .insert({
      description,
      category,
      amount,
      is_fixed: isFixed,
      due_date: dueDate,
      paid_date: paidNow ? todayInSaoPaulo() : null,
    })
    .select('id')
    .single()
  if (error) return { error: 'Erro ao criar despesa.' }

  await logAction(
    'expense.create', 'expense', created?.id ?? null,
    `Registrou a despesa "${description}" (R$ ${amount.toFixed(2)}, ${category})`,
    { description, category, amount, isFixed, dueDate, paidNow }
  )

  revalidatePath('/admin/financeiro')
  return { ok: true }
}

export async function markExpensePaid(id: string, paid: boolean): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const db = await adminDb()
  const { error } = await db
    .from('expenses')
    .update({ paid_date: paid ? todayInSaoPaulo() : null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: 'Erro ao atualizar despesa.' }

  await logAction('expense.mark_paid', 'expense', id, paid ? 'Marcou despesa como paga' : 'Desmarcou pagamento da despesa', { paid })

  revalidatePath('/admin/financeiro')
  return { ok: true }
}

export async function deleteExpense(id: string): Promise<{ ok?: boolean; error?: string }> {
  const ownerError = await requireOwner()
  if (ownerError) return ownerError

  const db = await adminDb()
  const { error } = await db.from('expenses').delete().eq('id', id)
  if (error) return { error: 'Erro ao excluir despesa.' }

  await logAction('expense.delete', 'expense', id, 'Excluiu despesa')

  revalidatePath('/admin/financeiro')
  return { ok: true }
}

/* ── Meu perfil (self-service, qualquer membro da equipe) ────────── */

export async function updateStaffProfile(input: { name: string; phone?: string; email: string; birthDate?: string }): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const name = input.name.trim()
  if (!isFullName(name)) return { error: 'Informe nome e sobrenome.' }

  const email = input.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'E-mail inválido.' }

  let phone: string | null = null
  if (input.phone?.trim()) {
    try {
      phone = formatWhatsApp(input.phone)
    } catch {
      return { error: 'Telefone inválido. Informe o DDD + 9 dígitos.' }
    }
  }

  const birthDate = input.birthDate?.trim() || null

  const db = await adminDb()

  // E-mail is the Supabase Auth login — separate from staff_members —
  // so it's only touched when it actually changed.
  if (email !== user.email) {
    const { error: authError } = await db.auth.admin.updateUserById(user.id, { email, email_confirm: true })
    if (authError) {
      const alreadyExists = authError.message?.toLowerCase().includes('already')
      return { error: alreadyExists ? 'Já existe uma conta com esse e-mail.' : 'Erro ao atualizar e-mail.' }
    }
  }

  const { error } = await db.from('staff_members').update({ name, phone, birth_date: birthDate }).eq('id', user.id)
  if (error) {
    if (error.code === '23505') return { error: 'Esse telefone já está em uso por outro membro da equipe.' }
    return { error: 'Erro ao salvar perfil.' }
  }

  revalidatePath('/admin/perfil')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

export async function updateStaffAvatar(avatarUrl: string | null): Promise<{ ok?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db.from('staff_members').update({ avatar_url: avatarUrl }).eq('id', user.id)
  if (error) return { error: 'Erro ao salvar foto.' }

  revalidatePath('/admin/perfil')
  revalidatePath('/admin', 'layout')
  return { ok: true }
}

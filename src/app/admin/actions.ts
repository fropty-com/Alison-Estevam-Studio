'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function adminDb() {
  // Service-role client — bypasses RLS, server-only
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ) as any
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
      metadata: metadata ?? null,
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
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
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
  const netBeforeFee   = Math.max(0, data.grossAmount - data.discount)
  const feeAmount      = Math.round(netBeforeFee * (feePercentage / 100) * 100) / 100
  const netAmount      = Math.round((netBeforeFee - feeAmount) * 100) / 100

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
      net_amount: netAmount,
      paid_at: now,
    }),
  ])

  if (apptError || paymentError) return { error: 'Erro ao registrar pagamento.' }

  await logAction(
    'appointment.checkout', 'appointment', id,
    `Registrou pagamento de R$ ${netAmount.toFixed(2)} (líquido) via ${data.method} no agendamento #${apptUpdated?.reference_code ?? id}`,
    { method: data.method, grossAmount: data.grossAmount, discount: data.discount, feeAmount, netAmount }
  )

  revalidatePath('/admin')
  revalidatePath('/admin/agenda')
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
  const { error } = await db.from('blocked_periods').insert({ date_start, date_end, reason: reason || null })
  if (error) return { error: 'Erro ao bloquear período.' }

  // Also mark existing available slots as blocked
  await db.from('time_slots')
    .update({ status: 'blocked' })
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

  await db.from('blocked_periods').delete().eq('id', id)

  if (period) {
    await db.from('time_slots')
      .update({ status: 'available' })
      .gte('date', period.date_start)
      .lte('date', period.date_end)
      .eq('status', 'blocked')

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
    `Alterou horário de funcionamento de ${WEEKDAY[before?.weekday] ?? 'um dia'}`,
    { before, after: data }
  )

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

/* ── Payment Fee Settings ─────────────────────── */

export async function updatePaymentFeeSetting(id: string, data: { fee_percentage?: number; active?: boolean }) {
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

  await logAction('staff.add', 'staff_member', created.user.id, `Adicionou ${name} à equipe como ${role === 'owner' ? 'dono' : 'funcionário'}`, { email, role })

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

  await logAction('staff.role_change', 'staff_member', id, `Mudou o papel de ${member?.name ?? id} para ${role === 'owner' ? 'dono' : 'funcionário'}`, { role })

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
async function ensureNotLastOwner(db: any, id: string): Promise<{ error: string } | null> {
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

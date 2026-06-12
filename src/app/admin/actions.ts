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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
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

  const { error } = await db.from('appointments').update(update).eq('id', id)
  if (error) return { error: 'Erro ao atualizar agendamento.' }

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
  const { error } = await db.from('services').update(data).eq('id', id)
  if (error) return { error: 'Erro ao atualizar serviço.' }

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
  }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

/* ── Availability Rules ───────────────────────── */

export async function updateAvailabilityRule(id: string, data: { start_time?: string; end_time?: string; active?: boolean }) {
  const user = await getSessionUser()
  if (!user) return { error: 'Não autorizado.' }

  const db = await adminDb()
  const { error } = await db.from('availability_rules').update(data).eq('id', id)
  if (error) return { error: 'Erro ao atualizar regra.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

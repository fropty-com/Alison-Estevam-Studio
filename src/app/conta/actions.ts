'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { destroyClientSession, getVerifiedClientSession } from '@/lib/client-auth/session'
import { createServiceClient } from '@/lib/supabase/server'

export async function logoutClientAction() {
  await destroyClientSession()
  redirect('/')
}

export async function confirmAppointmentAction(appointmentId: string): Promise<{ error?: string }> {
  const session = await getVerifiedClientSession()
  if (!session) return { error: 'Sessão expirada. Faça login novamente.' }

  const db = await createServiceClient() as any

  const { data: appt } = await db
    .from('appointments')
    .select('id, status')
    .eq('id', appointmentId)
    .eq('client_id', session.clientId)
    .single()

  if (!appt) return { error: 'Agendamento não encontrado.' }
  if (appt.status !== 'pending') return { error: 'Este agendamento já foi confirmado.' }

  const { error } = await db
    .from('appointments')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', appointmentId)

  if (error) return { error: 'Erro ao confirmar presença. Tente novamente.' }

  revalidatePath('/conta')
  return {}
}

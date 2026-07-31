import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/email/reminder'
import { todayInSaoPaulo } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

/**
 * Vercel Cron calls this once a day (see vercel.json) to send a "seu
 * horário é amanhã" e-mail for every appointment scheduled for tomorrow
 * (São Paulo calendar date) that hasn't been reminded yet. Vercel injects
 * `Authorization: Bearer $CRON_SECRET` on cron-triggered requests — any
 * other caller without that exact header is rejected.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const db = await createServiceClient()
  const tomorrow = todayInSaoPaulo(new Date(Date.now() + 24 * 60 * 60 * 1000))

  const { data: appointments, error } = await db
    .from('appointments')
    .select(`
      id, reference_code,
      services(name),
      clients(name, email, receive_reminder_emails),
      time_slots!inner(date, start_time)
    `)
    .in('status', ['pending', 'confirmed'])
    .eq('reminder_sent', false)
    .eq('time_slots.date', tomorrow)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let skipped = 0
  const failures: string[] = []

  for (const appt of appointments ?? []) {
    const client = Array.isArray(appt.clients) ? appt.clients[0] : appt.clients
    const service = Array.isArray(appt.services) ? appt.services[0] : appt.services
    const slot = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots

    if (!client?.email || client.receive_reminder_emails === false) {
      skipped++
      continue
    }

    try {
      await sendReminderEmail({
        clientName: client.name,
        clientEmail: client.email,
        serviceName: service?.name ?? 'Serviço',
        date: slot.date,
        startTime: String(slot.start_time).slice(0, 5),
        referenceCode: appt.reference_code,
      })
      await db.from('appointments').update({ reminder_sent: true }).eq('id', appt.id)
      sent++
    } catch (err) {
      failures.push(appt.reference_code)
      console.error(`Failed to send reminder for ${appt.reference_code}:`, err)
    }
  }

  return NextResponse.json({ date: tomorrow, total: (appointments ?? []).length, sent, skipped, failed: failures })
}

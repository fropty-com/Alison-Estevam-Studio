import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/email/reminder'
import { todayInSaoPaulo } from '@/lib/timezone'

export const dynamic = 'force-dynamic'

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/**
 * Vercel Cron calls this every 15 minutes (see vercel.json) to send a "seu
 * horário é daqui a pouco" e-mail for every appointment starting within the
 * next 2 hours that hasn't already gotten this reminder. Brazil has not
 * observed DST since 2019, so America/Sao_Paulo is always a fixed UTC-3 —
 * `${date}T${start_time}-03:00` is a valid, unambiguous instant with no
 * Intl gymnastics needed (unlike the day-boundary helpers in
 * `src/lib/timezone.ts`, which exist only because `new Date()` itself reads
 * as UTC on Vercel).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const db = await createServiceClient()
  const now = new Date()
  const today = todayInSaoPaulo(now)
  const tomorrow = todayInSaoPaulo(new Date(now.getTime() + 24 * 60 * 60 * 1000))

  const { data: appointments, error } = await db
    .from('appointments')
    .select(`
      id, reference_code,
      services(name),
      clients(name, email, receive_reminder_emails),
      time_slots!inner(date, start_time)
    `)
    .in('status', ['pending', 'confirmed'])
    .eq('reminder_2h_sent', false)
    .gte('time_slots.date', today)
    .lte('time_slots.date', tomorrow)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let skipped = 0
  let notYetDue = 0
  const failures: string[] = []

  for (const appt of appointments ?? []) {
    const client = Array.isArray(appt.clients) ? appt.clients[0] : appt.clients
    const service = Array.isArray(appt.services) ? appt.services[0] : appt.services
    const slot = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots
    if (!slot?.date || !slot?.start_time) { skipped++; continue }

    const apptInstant = new Date(`${slot.date}T${String(slot.start_time).slice(0, 5)}:00-03:00`)
    const diffMs = apptInstant.getTime() - now.getTime()

    // Not within 2h of start yet (or already started) — leave reminder_2h_sent
    // false so a later pass picks it up once it crosses the threshold.
    if (diffMs <= 0 || diffMs > TWO_HOURS_MS) { notYetDue++; continue }

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
        timing: 'soon',
      })
      await db.from('appointments').update({ reminder_2h_sent: true }).eq('id', appt.id)
      sent++
    } catch (err) {
      failures.push(appt.reference_code)
      console.error(`Failed to send 2h reminder for ${appt.reference_code}:`, err)
    }
  }

  return NextResponse.json({
    total: (appointments ?? []).length,
    sent,
    skipped,
    notYetDue,
    failed: failures,
  })
}

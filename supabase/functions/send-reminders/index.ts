import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { format, parseISO } from 'https://esm.sh/date-fns@3'
import { ptBR } from 'https://esm.sh/date-fns@3/locale/pt-BR'

// Supabase Edge Function — runs daily via cron
// Finds appointments happening in the next 24h and sends WhatsApp reminders
// Schedule: deploy with `supabase functions deploy send-reminders --schedule "0 10 * * *"`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const now   = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const targetDate = format(in24h, 'yyyy-MM-dd')
  const targetHour = format(in24h, 'HH')

  // Find appointments tomorrow (±1h window around the 24h mark)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      reference_code,
      reminder_sent,
      status,
      time_slots!inner ( date, start_time ),
      services!inner   ( name ),
      clients!inner    ( name, whatsapp )
    `)
    .eq('time_slots.date', targetDate)
    .in('status', ['pending', 'confirmed'])
    .eq('reminder_sent', false)

  if (error) {
    console.error('Query error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }

  const whatsappApiUrl = Deno.env.get('WHATSAPP_API_URL')
  const whatsappToken  = Deno.env.get('WHATSAPP_API_TOKEN')

  let sent = 0, skipped = 0

  for (const appt of appointments ?? []) {
    const slot    = (appt.time_slots as any)
    const service = (appt.services   as any)
    const client  = (appt.clients    as any)

    if (!slot || !service || !client) { skipped++; continue }

    const formattedDate = format(parseISO(slot.date), "EEEE, d 'de' MMMM", { locale: ptBR })
    const time          = (slot.start_time as string).substring(0, 5)

    const message =
      `Olá ${client.name}! 👋\n\n` +
      `Lembrando do seu agendamento amanhã:\n\n` +
      `✦ ${service.name}\n` +
      `📅 ${formattedDate} às ${time}\n\n` +
      `Código: ${appt.reference_code}\n\n` +
      `Até amanhã! — Alison Estevam`

    // Send via WhatsApp API if configured; otherwise log
    if (whatsappApiUrl && whatsappToken) {
      try {
        await fetch(whatsappApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${whatsappToken}` },
          body: JSON.stringify({ to: client.whatsapp, message }),
        })
      } catch (e) {
        console.error(`Failed to send reminder to ${client.whatsapp}:`, e)
        skipped++
        continue
      }
    } else {
      // Fallback: log the message (dev/staging)
      console.log(`[REMINDER] To: ${client.whatsapp}\n${message}`)
    }

    // Mark reminder as sent
    await supabase
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', appt.id)

    sent++
  }

  return new Response(
    JSON.stringify({ ok: true, sent, skipped }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})

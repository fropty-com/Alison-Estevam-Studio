import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { RescheduleFlow } from '@/components/booking/RescheduleFlow'
import { BackLink, StepHeader, DetailCard } from '@/components/booking/BookingChrome'
import { ClientHeader } from '@/components/layout/ClientHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reagendar' }
export const dynamic = 'force-dynamic'

export default async function ReagendarPage({ params }: { params: { code: string } }) {
  const db = await createServiceClient() as any
  const code = params.code.toUpperCase()

  const { data: appt } = await db
    .from('appointments')
    .select('id, reference_code, status, clients(name), services(name, duration), time_slots(date, start_time)')
    .eq('reference_code', code)
    .single()

  if (!appt) notFound()

  const slot    = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots
  const service = Array.isArray(appt.services)   ? appt.services[0]   : appt.services
  const client  = Array.isArray(appt.clients)    ? appt.clients[0]    : appt.clients

  const cannotReschedule = ['cancelled', 'completed', 'no_show'].includes(appt.status)

  const currentDateLabel = slot?.date
    ? format(parseISO(slot.date), "d 'de' MMMM", { locale: ptBR }) +
      ' às ' + (slot.start_time as string).substring(0, 5).replace(':', 'h')
    : '—'

  return (
    <div className="min-h-screen bg-charcoal">
      <ClientHeader />
      <div className="max-w-[480px] mx-auto">
        <div className="px-8 pt-[122px] pb-16">
          <BackLink href="/conta">← Voltar à conta</BackLink>

          <StepHeader
            eyebrow="Reagendamento"
            title="Escolha nova data e horário"
            subtitle={`${service?.name ?? 'Agendamento'} — o horário atual será liberado.`}
          />

          <DetailCard
            rows={[
              { label: 'Código',  value: code },
              { label: 'Cliente', value: client?.name  ?? '—' },
              { label: 'Serviço', value: service?.name ?? '—' },
              { label: 'Atual',   value: currentDateLabel },
            ]}
          />

          {cannotReschedule ? (
            <div className="border border-offwhite/10 p-6 text-center">
              <p className="font-display font-light text-[18px] text-offwhite/45 italic">
                Este agendamento não pode ser reagendado.
              </p>
            </div>
          ) : (
            <RescheduleFlow code={code} serviceName={service?.name} duration={service?.duration ?? 60} />
          )}
        </div>
      </div>
    </div>
  )
}

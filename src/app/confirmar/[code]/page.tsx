import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { ConfirmForm } from '@/components/booking/ConfirmForm'
import { BackLink, StepHeader, DetailCard } from '@/components/booking/BookingChrome'
import { ClientHeader } from '@/components/layout/ClientHeader'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Confirmar Presença' }
export const dynamic = 'force-dynamic'

export default async function ConfirmarPage({ params }: { params: { code: string } }) {
  const db = await createServiceClient() as any
  const code = params.code.toUpperCase()

  const { data: appt } = await db
    .from('appointments')
    .select('id, reference_code, status, clients(name), services(name), time_slots(date, start_time)')
    .eq('reference_code', code)
    .single()

  if (!appt) notFound()

  const slot    = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots
  const service = Array.isArray(appt.services)   ? appt.services[0]   : appt.services
  const client  = Array.isArray(appt.clients)    ? appt.clients[0]    : appt.clients

  const alreadyConfirmed = appt.status === 'confirmed'
  const cannotConfirm     = ['cancelled', 'completed', 'no_show'].includes(appt.status)

  const dateLabel = slot?.date
    ? format(parseISO(slot.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  return (
    <div className="min-h-screen bg-charcoal">
      <ClientHeader />
      <div className="max-w-[480px] mx-auto">
        <div className="px-8 pt-[122px] pb-16">
          <BackLink href="/conta">← Voltar à conta</BackLink>

          <StepHeader
            eyebrow="Confirmação"
            title="Confirmar presença"
            subtitle="Confirme que você vai comparecer neste horário."
          />

          <DetailCard
            rows={[
              { label: 'Código',  value: code },
              { label: 'Cliente', value: client?.name  ?? '—' },
              { label: 'Serviço', value: service?.name ?? '—' },
              { label: 'Data',    value: dateLabel },
              { label: 'Horário', value: slot?.start_time ? (slot.start_time as string).substring(0, 5).replace(':', 'h') : '—' },
            ]}
          />

          {alreadyConfirmed ? (
            <div className="border border-offwhite/14 p-6 text-center">
              <p className="font-display font-light text-[18px] text-offwhite/45 italic">
                Este agendamento já está confirmado.
              </p>
            </div>
          ) : cannotConfirm ? (
            <div className="border border-offwhite/14 p-6 text-center">
              <p className="font-display font-light text-[18px] text-offwhite/45 italic">
                Este agendamento não pode ser confirmado.
              </p>
            </div>
          ) : (
            <ConfirmForm code={code} />
          )}
        </div>
      </div>
    </div>
  )
}

import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import { RescheduleFlow } from '@/components/booking/RescheduleFlow'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reagendar' }

export default async function ReagendarPage({ params }: { params: { code: string } }) {
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

  const cannotReschedule = ['cancelled', 'completed', 'no_show'].includes(appt.status)

  const currentDateLabel = slot?.date
    ? format(parseISO(slot.date), "d 'de' MMMM", { locale: ptBR }) +
      ' às ' + (slot.start_time as string).substring(0, 5).replace(':', 'h')
    : '—'

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-[480px]">

        <div className="mb-8">
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-2">
            Alison Estevam Studio
          </p>
          <h1 className="font-display font-light text-[32px] text-offwhite tracking-[0.03em] leading-tight">
            Reagendar
          </h1>
        </div>

        {/* Current info */}
        <div className="bg-offwhite/3 border border-offwhite/7 p-6 mb-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-4">
            Agendamento atual
          </p>
          <div className="space-y-[10px]">
            {[
              { label: 'Código',  value: code },
              { label: 'Cliente', value: client?.name  ?? '—' },
              { label: 'Serviço', value: service?.name ?? '—' },
              { label: 'Atual',   value: currentDateLabel },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4">
                <span className="font-body font-light text-[8px] tracking-[0.25em] uppercase text-offwhite/28 w-16 shrink-0 pt-[2px]">
                  {label}
                </span>
                <span className="font-body font-light text-[13px] text-offwhite/70">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {cannotReschedule ? (
          <div className="bg-offwhite/3 border border-offwhite/7 p-6 text-center">
            <p className="font-display font-light text-[18px] text-offwhite/45 italic">
              Este agendamento não pode ser reagendado.
            </p>
          </div>
        ) : (
          <RescheduleFlow code={code} currentDate={currentDateLabel} />
        )}
      </div>
    </div>
  )
}

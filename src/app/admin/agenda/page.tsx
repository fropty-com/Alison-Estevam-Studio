import { createServiceClient } from '@/lib/supabase/server'
import { format, addDays, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { AppointmentActions } from '@/components/admin/AppointmentActions'
import { cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; color: string; border: string }> = {
  pending:   { label: 'Pendente',   color: 'text-warning',      border: 'border-l-warning'      },
  confirmed: { label: 'Confirmado', color: 'text-sage-light',   border: 'border-l-sage'         },
  completed: { label: 'Concluído',  color: 'text-offwhite/35',  border: 'border-l-offwhite/20'  },
  cancelled: { label: 'Cancelado',  color: 'text-error/50',     border: 'border-l-error/40'     },
  no_show:   { label: 'No-show',    color: 'text-error/40',     border: 'border-l-error/25'     },
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const dateStr = searchParams.date ?? format(new Date(), 'yyyy-MM-dd')
  const dateObj = parseISO(dateStr)
  const prev    = format(subDays(dateObj, 1), 'yyyy-MM-dd')
  const next    = format(addDays(dateObj, 1), 'yyyy-MM-dd')
  const label   = format(dateObj, "EEEE, d 'de' MMMM", { locale: ptBR })

  const db = await createServiceClient() as any

  const { data: raw } = await db
    .from('appointments')
    .select('id, reference_code, status, notes, services(name, price, duration), clients(id, name, whatsapp, vip), time_slots(date, start_time, end_time)')
    .eq('time_slots.date', dateStr)
    .order('time_slots(start_time)', { ascending: true })

  const appts = (raw ?? []) as any[]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Agenda</p>
          <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em] capitalize">
            {label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/agenda?date=${prev}`}
            className="w-9 h-9 border border-offwhite/10 text-offwhite/30 text-[13px] flex items-center justify-center hover:border-sage/40 hover:text-sage-light transition-all duration-200"
          >
            ‹
          </Link>
          <Link
            href="/admin/agenda"
            className="px-4 h-9 border border-offwhite/10 font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/35 flex items-center hover:border-sage/40 hover:text-sage-light transition-all duration-200"
          >
            Hoje
          </Link>
          <Link
            href={`/admin/agenda?date=${next}`}
            className="w-9 h-9 border border-offwhite/10 text-offwhite/30 text-[13px] flex items-center justify-center hover:border-sage/40 hover:text-sage-light transition-all duration-200"
          >
            ›
          </Link>
        </div>
      </div>

      {/* Appointments */}
      {appts.length === 0 ? (
        <div className="bg-offwhite/3 border border-offwhite/7 p-10 text-center">
          <p className="font-display font-light text-[20px] text-offwhite/18 italic">
            Nenhum agendamento para este dia.
          </p>
        </div>
      ) : (
        <div className="space-y-[8px]">
          {appts.map((a: any) => {
            const st   = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
            const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
            const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
            const cli  = Array.isArray(a.clients)    ? a.clients[0]    : a.clients
            const time = slot?.start_time?.substring(0, 5) ?? '--'

            return (
              <div key={a.id} className={cn('bg-offwhite/3 border border-offwhite/7 border-l-[3px] p-5', st.border)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Time */}
                    <div className="shrink-0 text-center">
                      <p className="font-data text-[22px] text-offwhite/70 leading-none">{time}</p>
                      <p className="font-body font-light text-[8px] text-offwhite/25 mt-[3px] tracking-[0.15em]">
                        {svc?.duration ? `${svc.duration}min` : ''}
                      </p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-[3px]">
                        <p className="font-body font-light text-[14px] text-offwhite">{cli?.name ?? '—'}</p>
                        {cli?.vip && (
                          <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70">VIP</span>
                        )}
                      </div>
                      <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.15em] mb-[2px]">
                        {svc?.name ?? '—'} · {svc?.price ? `R$ ${svc.price}` : ''}
                      </p>
                      <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">
                        {cli?.whatsapp} · #{a.reference_code}
                      </p>
                      {a.notes && (
                        <p className="mt-2 font-body font-light text-[10px] text-offwhite/40 italic border-l border-offwhite/12 pl-2">
                          {a.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={cn('font-body font-light text-[8px] tracking-[0.22em] uppercase shrink-0', st.color)}>
                    {st.label}
                  </span>
                </div>

                {/* Actions */}
                <AppointmentActions id={a.id} status={a.status} notes={a.notes} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

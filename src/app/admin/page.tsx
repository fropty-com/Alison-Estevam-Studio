import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:     { label: 'Pendente',       color: 'text-warning border-warning/30 bg-warning/8'  },
  confirmed:   { label: 'Confirmado',     color: 'text-sage-light border-sage/30 bg-sage/8'     },
  checked_in:  { label: 'Chegou',         color: 'text-gold border-gold/30 bg-gold/8'           },
  in_progress: { label: 'Em atendimento', color: 'text-gold border-gold/30 bg-gold/8'           },
  completed:   { label: 'Concluído',      color: 'text-offwhite/40 border-offwhite/12 bg-offwhite/3' },
  cancelled:   { label: 'Cancelado',      color: 'text-error/60 border-error/20 bg-error/5'     },
  no_show:     { label: 'No-show',        color: 'text-error/45 border-error/15 bg-error/4'     },
}

export default async function AdminDashboard() {
  const db = await createServiceClient() as any

  const today     = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(), { weekStartsOn: 1 }),   'yyyy-MM-dd')

  const [todayRes, weekRes, clientsRes] = await Promise.all([
    db.from('appointments')
      .select('id, reference_code, status, services(name, price), clients(name, whatsapp), time_slots!inner(date, start_time)')
      .eq('time_slots.date', today)
      .not('status', 'in', '("cancelled","no_show")')
      .order('time_slots(start_time)', { ascending: true }),

    db.from('appointments')
      .select('id, status, time_slots!inner(date)', { count: 'exact' })
      .gte('time_slots.date', weekStart)
      .lte('time_slots.date', weekEnd)
      .not('status', 'in', '("cancelled","no_show")'),

    db.from('clients').select('id', { count: 'exact', head: true }),
  ])

  const todayAppts  = (todayRes.data   ?? []) as any[]
  const weekCount   = weekRes.count    ?? 0
  const totalClients = clientsRes.count ?? 0

  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">
          {todayLabel}
        </p>
        <h1 className="font-display font-light text-[34px] text-offwhite tracking-[0.03em]">
          Bom dia, Alison.
        </h1>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: 'Hoje',           value: todayAppts.length, sub: 'agendamentos' },
          { label: 'Esta semana',    value: weekCount,          sub: 'confirmados'  },
          { label: 'Total clientes', value: totalClients,       sub: 'cadastrados'  },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-offwhite/3 border border-offwhite/7 p-6">
            <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/28 mb-2">{label}</p>
            <p className="font-data text-[32px] text-offwhite leading-none mb-1">{value}</p>
            <p className="font-body font-light text-[9px] text-offwhite/28">{sub}</p>
          </div>
        ))}
      </div>

      {/* Today's agenda */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/45">
            Agenda de hoje
          </h2>
          <Link
            href="/admin/agenda"
            className="font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-sage-light/60 hover:text-sage-light transition-colors"
          >
            Ver completa →
          </Link>
        </div>

        {todayAppts.length === 0 ? (
          <div className="bg-offwhite/3 border border-offwhite/7 p-8 text-center">
            <p className="font-display font-light text-[18px] text-offwhite/22 italic">
              Nenhum agendamento para hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-[6px]">
            {todayAppts.map((a: any) => {
              const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending
              const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
              const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
              const cli  = Array.isArray(a.clients)    ? a.clients[0]    : a.clients
              return (
                <div key={a.id} className="flex items-center gap-4 bg-offwhite/3 border border-offwhite/7 px-5 py-4">
                  <span className="font-data text-[20px] text-offwhite/60 w-12 shrink-0">
                    {slot?.start_time?.substring(0, 5) ?? '--'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-light text-[13px] text-offwhite truncate">{cli?.name ?? '—'}</p>
                    <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.15em]">
                      {svc?.name ?? '—'}
                    </p>
                  </div>
                  <span className={cn(
                    'font-body font-light text-[8px] tracking-[0.22em] uppercase px-[9px] py-[4px] border',
                    st.color
                  )}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

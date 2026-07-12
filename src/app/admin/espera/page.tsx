import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { WaitlistEntryRow } from '@/components/admin/WaitlistEntryRow'
import { buildWaitlistNotifyUrl } from '@/lib/whatsapp/messages'

export const dynamic = 'force-dynamic'

function dayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  return format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
}

export default async function EsperaPage() {
  const db = await createServiceClient() as any

  const { data: raw } = await db
    .from('waitlist_entries')
    .select('id, preferred_date, note, status, clients(name, whatsapp), services(name)')
    .in('status', ['waiting', 'notified'])
    .order('preferred_date', { ascending: true })
    .order('created_at', { ascending: true })

  const entries = (raw ?? []) as any[]

  const groups: { day: string; items: any[] }[] = []
  for (const entry of entries) {
    const last = groups[groups.length - 1]
    if (last && last.day === entry.preferred_date) last.items.push(entry)
    else groups.push({ day: entry.preferred_date, items: [entry] })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Fila de espera</h1>
        <p className="font-body font-light text-[10px] text-offwhite/28 tracking-[0.1em] mt-1">
          Clientes esperando um horário abrir. {entries.length} na fila.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-offwhite/3 border border-offwhite/7 p-10 text-center">
          <p className="font-display font-light text-[20px] text-offwhite/18 italic">
            Ninguém na fila de espera.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ day, items }) => (
            <div key={day}>
              <p className="font-body font-light text-[8px] tracking-[0.32em] uppercase text-offwhite/30 mb-3">
                {dayLabel(day)}
              </p>
              <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
                {items.map((entry: any) => (
                  <WaitlistEntryRow
                    key={entry.id}
                    id={entry.id}
                    clientName={entry.clients?.name ?? '—'}
                    clientWhatsapp={entry.clients?.whatsapp ?? ''}
                    serviceName={entry.services?.name ?? '—'}
                    note={entry.note}
                    status={entry.status}
                    notifyUrl={buildWaitlistNotifyUrl({
                      clientName: entry.clients?.name ?? '',
                      clientWhatsapp: entry.clients?.whatsapp ?? '',
                      serviceName: entry.services?.name ?? '',
                      date: entry.preferred_date,
                    })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

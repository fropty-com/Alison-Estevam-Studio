import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { ClientsTable, type ClientRow } from '@/components/admin/ClientsTable'
import { AbsentClientsCard } from '@/components/admin/AbsentClientsCard'
import { nowAnchorInSaoPaulo } from '@/lib/timezone'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

interface ClientRecord {
  id: string
  name: string
  whatsapp: string
  email: string | null
  vip: boolean
  created_at: string
  notes: string | null
  birth_date: string | null
}

export const dynamic = 'force-dynamic'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function ClientesPage() {
  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)
  const dateLocale = DATE_FNS_LOCALE[locale]

  const now        = nowAnchorInSaoPaulo()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const monthStartISO = `${monthStart}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`

  const [clientsRes, completedRes, monthPayRes] = await Promise.all([
    db.from('clients')
      .select('id, name, whatsapp, email, vip, created_at, notes, birth_date')
      .order('name', { ascending: true }),

    // histórico completo de atendimentos concluídos, por cliente — base para
    // frequência, recorrência e retenção
    db.from('appointments')
      .select('client_id, clients(id, name), time_slots!inner(date)')
      .eq('status', 'completed'),

    // pagamentos deste mês, com o cliente de origem — base do ticket médio/cliente
    db.from('payments')
      .select('gross_amount, appointments(client_id)')
      .gte('paid_at', monthStartISO)
      .lt('paid_at', nextMonthISO),
  ])

  const list = (clientsRes.data ?? []) as ClientRecord[]
  const completedHistory = completedRes.data ?? []
  const monthPayments = monthPayRes.data ?? []

  const tableRows: ClientRow[] = list.map(c => ({
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    email: c.email,
    birthDate: c.birth_date,
    vip: c.vip,
    createdAt: c.created_at,
  }))

  // Aniversariantes deste mês — comparação por mês da data (string, sem
  // conversão de timezone), ordenados pelo dia do mês
  const currentMonth = format(now, 'MM')
  const birthdaysThisMonth = list
    .filter(c => c.birth_date && c.birth_date.slice(5, 7) === currentMonth)
    .map(c => ({ id: c.id, name: c.name, birthDate: c.birth_date as string }))
    .sort((a, b) => a.birthDate.slice(8, 10).localeCompare(b.birthDate.slice(8, 10)))

  // Histórico por cliente, ordenado — base de tudo abaixo
  const clientHistory: Record<string, { id: string; name: string; dates: string[] }> = {}
  for (const a of completedHistory) {
    const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
    const slot   = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    if (!client?.id || !slot?.date) continue
    if (!clientHistory[client.id]) clientHistory[client.id] = { id: client.id, name: client.name, dates: [] }
    clientHistory[client.id].dates.push(slot.date)
  }
  const clientsWithHistory = Object.values(clientHistory).map(c => ({ ...c, dates: c.dates.sort() }))

  // Novos vs Recorrentes deste mês: entre quem teve atendimento este mês,
  // "novo" é quem teve a primeira visita da vida dentro do próprio mês.
  const visitedThisMonth = clientsWithHistory.filter(c => c.dates.some(d => d >= monthStart && d <= monthEnd))
  const novosThisMonth = visitedThisMonth.filter(c => c.dates[0] >= monthStart).length
  const recorrentesThisMonth = visitedThisMonth.length - novosThisMonth
  const visitsThisMonthCount = visitedThisMonth.reduce(
    (sum, c) => sum + c.dates.filter(d => d >= monthStart && d <= monthEnd).length, 0
  )
  const frequenciaMedia = visitedThisMonth.length > 0 ? visitsThisMonthCount / visitedThisMonth.length : 0

  // Ticket médio por cliente deste mês
  const revenueThisMonth = monthPayments.reduce((sum, p) => sum + Number(p.gross_amount ?? 0), 0)
  const payingClientIds = new Set(
    monthPayments
      .map(p => (Array.isArray(p.appointments) ? p.appointments[0] : p.appointments)?.client_id)
      .filter(Boolean)
  )
  const ticketMedioCliente = payingClientIds.size > 0 ? revenueThisMonth / payingClientIds.size : 0

  // Retenção / clientes ausentes — a partir do padrão de retorno de cada cliente recorrente
  const recurringClients = clientsWithHistory.filter(c => c.dates.length >= 2)
  const retentionRate = clientsWithHistory.length > 0 ? (recurringClients.length / clientsWithHistory.length) * 100 : 0

  const absences: { id: string; name: string; daysSinceLast: number; avgGap: number }[] = []
  for (const c of recurringClients) {
    const gaps: number[] = []
    for (let i = 1; i < c.dates.length; i++) {
      gaps.push(differenceInDays(parseISO(c.dates[i]), parseISO(c.dates[i - 1])))
    }
    const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length
    const daysSinceLast = differenceInDays(now, parseISO(c.dates[c.dates.length - 1]))
    absences.push({ id: c.id, name: c.name, daysSinceLast, avgGap: Math.round(avgGap) })
  }
  absences.sort((a, b) => b.daysSinceLast - a.daysSinceLast)

  return (
    <div className="px-6 py-8 space-y-10">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">{t.clients.eyebrow}</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">
          {t.clients.title} <span className="text-offwhite/25 text-[22px]">{list.length}</span>
        </h1>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.clients.cardNewVsReturning}</p>
          <p className="font-data text-[26px] leading-none mb-2">
            <span className="text-sage-light">{novosThisMonth}</span>
            <span className="text-offwhite/25"> / </span>
            <span className="text-offwhite">{recorrentesThisMonth}</span>
          </p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.clients.newReturningSub}</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.clients.avgFrequency}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{frequenciaMedia.toFixed(1)}x</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.clients.avgFrequencySub}</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">{t.clients.avgTicket}</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(ticketMedioCliente)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">{t.clients.avgTicketSub}</p>
        </div>
      </div>

      {/* Aniversariantes deste mês */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-display font-light text-[17px] text-offwhite mb-1">{t.clients.birthdaysTitle}</p>
        <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mb-6">
          {t.clients.birthdaysSub(birthdaysThisMonth.length)}
        </p>
        {birthdaysThisMonth.length === 0 ? (
          <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">
            {t.clients.noBirthdays}
          </p>
        ) : (
          <div className="divide-y divide-offwhite/6 -mx-6">
            {birthdaysThisMonth.map(b => (
              <div key={b.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-body font-light text-[12px] text-offwhite/70">{b.name}</span>
                <span className="font-body font-light text-[9px] text-gold/70 tracking-[0.1em]">
                  {format(parseISO(b.birthDate), locale === 'pt' ? "d 'de' MMMM" : 'MMMM d', { locale: dateLocale })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ClientsTable clients={tableRows} />

      {/* Retenção / clientes ausentes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40">
            {t.clients.retention}
          </h2>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">
            {t.clients.retentionSub(recurringClients.length, clientsWithHistory.length, retentionRate.toFixed(1))}
          </p>
        </div>

        <AbsentClientsCard absences={absences} />
      </section>
    </div>
  )
}

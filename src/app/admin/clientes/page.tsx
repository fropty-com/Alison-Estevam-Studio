import { createServiceClient } from '@/lib/supabase/server'
import { format, startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns'
import { ClientListFilter, type ClientListItem } from '@/components/admin/ClientListFilter'
import { AbsentClientsCard } from '@/components/admin/AbsentClientsCard'

export const dynamic = 'force-dynamic'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function ClientesPage() {
  const db = await createServiceClient() as any

  const now        = new Date()
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(now), 'yyyy-MM-dd')
  const monthStartISO = `${monthStart}T00:00:00`
  const nextMonthISO  = `${format(startOfMonth(now), 'yyyy-MM-dd')}T00:00:00`

  const [clientsRes, completedRes, monthPayRes] = await Promise.all([
    db.from('clients')
      .select('id, name, whatsapp, email, vip, created_at, notes')
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

  const list = (clientsRes.data ?? []) as ClientListItem[]
  const completedHistory = (completedRes.data ?? []) as any[]
  const monthPayments = (monthPayRes.data ?? []) as any[]

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
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">
          Clientes <span className="text-offwhite/25 text-[22px]">{list.length}</span>
        </h1>
      </div>

      {/* Cards do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Novos vs recorrentes</p>
          <p className="font-data text-[26px] leading-none mb-2">
            <span className="text-sage-light">{novosThisMonth}</span>
            <span className="text-offwhite/25"> / </span>
            <span className="text-offwhite">{recorrentesThisMonth}</span>
          </p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">novos / recorrentes este mês</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Frequência média</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{frequenciaMedia.toFixed(1)}x</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">visitas por cliente este mês</p>
        </div>

        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8px] tracking-[0.38em] uppercase text-offwhite/[0.28] mb-3">Ticket médio/cliente</p>
          <p className="font-data text-[26px] text-offwhite leading-none mb-2">{fmt(ticketMedioCliente)}</p>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.12em]">receita por cliente este mês</p>
        </div>
      </div>

      <ClientListFilter clients={list} />

      {/* Retenção / clientes ausentes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40">
            Retenção
          </h2>
          <p className="font-body font-light text-[9px] text-offwhite/25 tracking-[0.1em]">
            {recurringClients.length} de {clientsWithHistory.length} clientes voltaram · {retentionRate.toFixed(1)}%
          </p>
        </div>

        <AbsentClientsCard absences={absences} />
      </section>
    </div>
  )
}

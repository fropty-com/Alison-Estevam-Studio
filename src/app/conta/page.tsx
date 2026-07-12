import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { formatCurrency, cn } from '@/lib/utils'
import { getLoyaltyProgress } from '@/lib/loyalty'
import { logoutClientAction } from './actions'

export const metadata: Metadata = { title: 'Minha Conta — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  pending:     'Pendente',
  confirmed:   'Confirmado',
  checked_in:  'Você chegou',
  in_progress: 'Em atendimento',
  completed:   'Concluído',
  cancelled:   'Cancelado',
  no_show:     'Não compareceu',
}

const UPCOMING_STATUSES = ['pending', 'confirmed', 'checked_in', 'in_progress']

export default async function ContaPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any

  const { data: client } = await db
    .from('clients')
    .select('id, name')
    .eq('id', session.clientId)
    .single()

  if (!client) redirect('/entrar')

  const { data: apptsRaw } = await db
    .from('appointments')
    .select('id, reference_code, status, total_price, services(name), time_slots!inner(date, start_time)')
    .eq('client_id', client.id)
    .order('time_slots(date)', { ascending: false })
    .order('time_slots(start_time)', { ascending: false })

  const appts = (apptsRaw ?? []) as any[]
  const upcoming = appts.filter(a => UPCOMING_STATUSES.includes(a.status)).reverse()
  const history  = appts.filter(a => a.status === 'completed').slice(0, 5)
  const next     = upcoming[0]
  const loyalty  = await getLoyaltyProgress(db, client.id)
  const loyaltyPct = Math.min(100, (loyalty.progress / loyalty.visitsRequired) * 100)

  return (
    <div className="min-h-screen bg-charcoal">
      {/* Header */}
      <div className="border-b border-offwhite/6">
        <div className="max-w-[560px] mx-auto flex items-center justify-between px-8 py-7">
          <Link href="/" className="font-display font-light text-lg tracking-[0.06em] uppercase text-offwhite/70 hover:text-offwhite transition-colors">
            Alison Estevam
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/perfil"
              className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
            >
              Perfil
            </Link>
            <form action={logoutClientAction}>
              <button
                type="submit"
                className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-8 py-10">
        {/* Greeting */}
        <p className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/28 mb-[6px]">
          Área do Cliente
        </p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.02em] mb-[26px]">
          Olá, {client.name.split(' ')[0]}.
        </h1>

        {/* Loyalty progress */}
        <div className="mb-[34px] border border-offwhite/10 px-6 py-5">
          {loyalty.availableRewards > 0 ? (
            <>
              <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-gold/70 mb-[6px]">Fidelidade</p>
              <p className="font-body font-light text-[14px] text-gold">
                {loyalty.availableRewards > 1 ? `Você tem ${loyalty.availableRewards} recompensas disponíveis!` : 'Você tem uma recompensa disponível!'}
              </p>
              <p className="font-body font-light text-[11px] text-offwhite/45 mt-[4px]">
                {loyalty.rewardDescription} — resgate no seu próximo atendimento.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-[10px]">
                <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/40">Fidelidade</p>
                <span className="font-data text-[13px] text-offwhite/60">
                  {loyalty.progress} <span className="text-offwhite/25">/ {loyalty.visitsRequired}</span>
                </span>
              </div>
              <div className="w-full h-[4px] bg-offwhite/6 rounded-none mb-[10px]">
                <div className="h-full bg-gold/50 transition-all duration-500" style={{ width: `${loyaltyPct}%` }} />
              </div>
              <p className="font-body font-light text-[11px] text-offwhite/40">
                Faltam {loyalty.visitsRequired - loyalty.progress} atendimento{loyalty.visitsRequired - loyalty.progress !== 1 ? 's' : ''} para: <span className="text-offwhite/60">{loyalty.rewardDescription}</span>
              </p>
            </>
          )}
        </div>

        {/* Next appointment */}
        <div className="mb-[34px]">
          <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/40 mb-[12px]">
            Próximo agendamento
          </p>

          {next ? (
            <AppointmentCard appt={next} />
          ) : (
            <div className="border border-offwhite/10 px-6 py-8 text-center">
              <p className="font-body font-light text-[13px] text-offwhite/40 mb-[16px]">
                Você não tem agendamentos futuros.
              </p>
              <Link
                href="/agendar"
                className="inline-block font-body font-medium text-[9.5px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep px-7 py-[13px] transition-all duration-300 hover:bg-gold-light"
              >
                Agendar horário
              </Link>
            </div>
          )}
        </div>

        {next && (
          <Link
            href="/agendar"
            className="block w-full text-center mb-[34px] font-body font-medium text-[9.5px] tracking-[0.35em] uppercase border border-gold/40 text-gold px-7 py-[14px] transition-all duration-300 hover:bg-gold/8"
          >
            Novo agendamento
          </Link>
        )}

        {/* Other upcoming */}
        {upcoming.length > 1 && (
          <div className="mb-[34px]">
            <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/40 mb-[12px]">
              Outros agendamentos
            </p>
            <div className="flex flex-col gap-[10px]">
              {upcoming.slice(1).map(a => <AppointmentCard key={a.id} appt={a} compact />)}
            </div>
          </div>
        )}

        {/* History */}
        <div>
          <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/40 mb-[12px]">
            Histórico recente
          </p>
          {history.length === 0 ? (
            <p className="font-body font-light text-[12px] text-offwhite/30 italic">
              Nenhum atendimento concluído ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-[10px]">
              {history.map(a => {
                const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
                const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
                const dateLabel = slot?.date ? format(parseISO(slot.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—'
                return (
                  <div key={a.id} className="flex items-center justify-between border border-offwhite/8 px-5 py-4">
                    <div>
                      <p className="font-body font-light text-[13px] text-offwhite/70">{svc?.name ?? '—'}</p>
                      <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mt-[2px] capitalize">{dateLabel}</p>
                    </div>
                    <span className="font-data text-sm text-gold">{formatCurrency(Number(a.total_price))}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AppointmentCard({ appt, compact }: { appt: any; compact?: boolean }) {
  const slot = Array.isArray(appt.time_slots) ? appt.time_slots[0] : appt.time_slots
  const svc  = Array.isArray(appt.services)   ? appt.services[0]   : appt.services
  const dateLabel = slot?.date ? format(parseISO(slot.date), "EEEE, d 'de' MMMM", { locale: ptBR }) : '—'
  const timeLabel = slot?.start_time ? (slot.start_time as string).substring(0, 5) : '—'
  const canModify = appt.status === 'pending' || appt.status === 'confirmed'

  return (
    <div className="border border-offwhite/10 px-6 py-5">
      <div className="flex items-start justify-between gap-4 mb-[4px]">
        <p className="font-display font-light text-xl text-offwhite tracking-[0.02em]">{svc?.name ?? '—'}</p>
        <span className="font-data text-lg text-gold shrink-0">{formatCurrency(Number(appt.total_price))}</span>
      </div>
      <p className="font-body font-light text-[12px] text-offwhite/45 capitalize mb-[2px]">
        {dateLabel} às {timeLabel}
      </p>
      <p className={cn(
        'font-body font-light text-[9px] tracking-[0.2em] uppercase mb-[14px]',
        appt.status === 'checked_in' || appt.status === 'in_progress' ? 'text-gold' : 'text-offwhite/35'
      )}>
        {STATUS_LABEL[appt.status] ?? appt.status}
      </p>

      {canModify && !compact && (
        <div className="flex gap-[8px]">
          <Link
            href={`/reagendar/${appt.reference_code}`}
            className="flex-1 text-center px-3 py-[9px] font-body font-light text-[8.5px] tracking-[0.2em] uppercase border border-offwhite/15 text-offwhite/55 hover:border-offwhite/35 hover:text-offwhite/80 transition-all duration-200"
          >
            Reagendar
          </Link>
          <Link
            href={`/cancelar/${appt.reference_code}`}
            className="flex-1 text-center px-3 py-[9px] font-body font-light text-[8.5px] tracking-[0.2em] uppercase border border-error/25 text-error/55 hover:border-error/45 hover:text-error/75 transition-all duration-200"
          >
            Cancelar
          </Link>
        </div>
      )}
    </div>
  )
}

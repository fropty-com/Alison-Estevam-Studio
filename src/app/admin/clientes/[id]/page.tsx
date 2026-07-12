import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ClientActions } from '@/components/admin/ClientActions'
import { LoyaltyCard } from '@/components/admin/LoyaltyCard'
import { getLoyaltyProgress } from '@/lib/loyalty'

export const dynamic = 'force-dynamic'

const STATUS_COLOR: Record<string, string> = {
  pending:   'text-warning',
  confirmed: 'text-sage-light',
  completed: 'text-offwhite/40',
  cancelled: 'text-error/50',
  no_show:   'text-error/40',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído',
  cancelled: 'Cancelado', no_show: 'No-show',
}

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const db = await createServiceClient() as any

  const [clientRes, apptsRes] = await Promise.all([
    db.from('clients').select('*').eq('id', params.id).single(),
    db.from('appointments')
      .select('id, reference_code, status, created_at, services(name, price), time_slots(date, start_time)')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!clientRes.data) notFound()

  const client = clientRes.data as any
  const appts  = (apptsRes.data ?? []) as any[]

  const completed = appts.filter((a: any) => a.status === 'completed').length
  const total     = appts.length
  const loyalty   = await getLoyaltyProgress(db, params.id)

  return (
    <div className="p-8">
      {/* Back */}
      <Link href="/admin/clientes" className="inline-flex items-center gap-2 font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/28 hover:text-offwhite/55 transition-colors mb-6">
        ← Clientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client card */}
        <div className="lg:col-span-1">
          <div className="bg-offwhite/3 border border-offwhite/7 p-6">
            <div className="flex items-center gap-2 mb-5">
              <h1 className="font-display font-light text-[24px] text-offwhite tracking-[0.03em]">
                {client.name}
              </h1>
              {client.vip && (
                <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70">VIP</span>
              )}
            </div>

            <div className="space-y-[10px] mb-6">
              {[
                { label: 'WhatsApp', value: client.whatsapp },
                { label: 'E-mail',   value: client.email ?? '—' },
                { label: 'Visitas',  value: `${completed} concluídas / ${total} total` },
                { label: 'Desde',    value: format(parseISO(client.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/25 mb-[2px]">{label}</p>
                  <p className="font-body font-light text-[12px] text-offwhite/70">{value}</p>
                </div>
              ))}
            </div>

            {/* Client actions (notes + vip toggle) */}
            <ClientActions id={client.id} vip={client.vip} notes={client.notes ?? ''} />
          </div>

          <div className="mt-4">
            <LoyaltyCard
              clientId={client.id}
              progress={loyalty.progress}
              visitsRequired={loyalty.visitsRequired}
              rewardDescription={loyalty.rewardDescription}
              availableRewards={loyalty.availableRewards}
            />
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-2">
          <h2 className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-4">
            Histórico de agendamentos
          </h2>

          {appts.length === 0 ? (
            <div className="bg-offwhite/3 border border-offwhite/7 p-8 text-center">
              <p className="font-display font-light text-[18px] text-offwhite/18 italic">Sem histórico.</p>
            </div>
          ) : (
            <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
              {appts.map((a: any) => {
                const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
                const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-light text-[12px] text-offwhite mb-[2px]">{svc?.name ?? '—'}</p>
                      <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.12em]">
                        {slot?.date ? format(parseISO(slot.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—'}
                        {slot?.start_time ? ` às ${slot.start_time.substring(0, 5)}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-body font-light text-[8.5px] tracking-[0.2em] uppercase', STATUS_COLOR[a.status] ?? 'text-offwhite/35')}>
                        {STATUS_LABEL[a.status] ?? a.status}
                      </p>
                      {svc?.price && (
                        <p className="font-data text-[12px] text-offwhite/40 mt-[2px]">R$ {svc.price}</p>
                      )}
                    </div>
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

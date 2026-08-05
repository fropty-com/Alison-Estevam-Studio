import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ClientActions } from '@/components/admin/ClientActions'
import { EditClientButton } from '@/components/admin/EditClientButton'
import { LoyaltyCard } from '@/components/admin/LoyaltyCard'
import { getLoyaltyProgress } from '@/lib/loyalty'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'

export const dynamic = 'force-dynamic'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

const STATUS_COLOR: Record<string, string> = {
  pending:   'text-gold',
  confirmed: 'text-sage-light',
  completed: 'text-offwhite/55',
  cancelled: 'text-error/50',
  no_show:   'text-error/40',
}

export default async function ClienteDetailPage({ params }: { params: { id: string } }) {
  const db = await createServiceClient()
  const locale = await getLocale()
  const t = getDictionary(locale)
  const dateLocale = DATE_FNS_LOCALE[locale]

  const [clientRes, apptsRes] = await Promise.all([
    db.from('clients').select('*').eq('id', params.id).single(),
    db.from('appointments')
      .select('id, reference_code, status, created_at, services(name, price), time_slots(date, start_time)')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false }),
  ])

  if (!clientRes.data) notFound()

  const client = clientRes.data
  const appts  = apptsRes.data ?? []

  const completed = appts.filter((a: any) => a.status === 'completed').length
  const total     = appts.length
  const loyalty   = await getLoyaltyProgress(db, params.id)

  return (
    <div className="px-6 py-8">
      {/* Back */}
      <Link href="/admin/clientes" className="inline-flex items-center gap-2 font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/55 hover:text-offwhite/85 transition-colors mb-6">
        {t.clients.backToClients}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client card */}
        <div className="lg:col-span-1">
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-display font-light text-[24px] text-offwhite tracking-[0.03em] truncate">
                  {client.name}
                </h1>
                {client.vip && (
                  <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70 shrink-0">VIP</span>
                )}
              </div>
              <EditClientButton id={client.id} name={client.name} whatsapp={client.whatsapp} email={client.email} birthDate={client.birth_date} />
            </div>

            <div className="space-y-[10px] mb-6">
              {[
                { label: t.clients.detail.whatsapp, value: client.whatsapp },
                { label: t.clients.detail.email,   value: client.email ?? '—' },
                { label: t.clients.detail.visitsLabel,  value: t.clients.detail.visits(completed, total) },
                { label: t.clients.detail.since,    value: format(parseISO(client.created_at), locale === 'pt' ? "d 'de' MMMM 'de' yyyy" : 'MMMM d, yyyy', { locale: dateLocale }) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-[2px]">{label}</p>
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
          <h2 className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
            {t.clients.detail.historyTitle}
          </h2>

          {appts.length === 0 ? (
            <div className="bg-offwhite/5 border border-offwhite/[0.07] p-8 text-center">
              <p className="font-display font-light text-[18px] text-offwhite/55 italic">{t.clients.detail.noHistory}</p>
            </div>
          ) : (
            <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
              {appts.map((a: any) => {
                const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
                const svc  = Array.isArray(a.services)   ? a.services[0]   : a.services
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-light text-[12px] text-offwhite mb-[2px]">{svc?.name ?? '—'}</p>
                      <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.12em]">
                        {slot?.date ? format(parseISO(slot.date), locale === 'pt' ? "d 'de' MMMM 'de' yyyy" : 'MMMM d, yyyy', { locale: dateLocale }) : '—'}
                        {slot?.start_time ? t.clients.detail.at(slot.start_time.substring(0, 5)) : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('font-body font-light text-[8.5px] tracking-[0.2em] uppercase', STATUS_COLOR[a.status] ?? 'text-offwhite/55')}>
                        {t.dashboard.status[a.status as keyof typeof t.dashboard.status] ?? a.status}
                      </p>
                      {svc?.price && (
                        <p className="font-data text-[12px] text-offwhite/55 mt-[2px]">R$ {svc.price}</p>
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

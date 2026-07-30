'use client'

import { useEffect, useState, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ClientActions } from './ClientActions'
import { EditClientButton } from './EditClientButton'
import { LoyaltyCard } from './LoyaltyCard'

interface ClientDetail {
  id: string
  name: string
  whatsapp: string
  email: string | null
  birthDate: string | null
  vip: boolean
  notes: string | null
  createdAt: string
}
interface HistoryItem {
  id: string
  status: string
  date: string | null
  startTime: string | null
  serviceName: string
  servicePrice: number | null
}
interface LoyaltyProgress {
  visitsRequired: number
  rewardDescription: string
  progress: number
  availableRewards: number
}

const STATUS_COLOR: Record<string, string> = {
  pending:   'text-gold',
  confirmed: 'text-sage-light',
  completed: 'text-offwhite/40',
  cancelled: 'text-error/50',
  no_show:   'text-error/40',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído',
  cancelled: 'Cancelado', no_show: 'No-show',
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function ClientDetailDrawer({ clientId, onClose }: { clientId: string | null; onClose: () => void }) {
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loyalty, setLoyalty] = useState<LoyaltyProgress | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/clients/${id}`)
      const data = await res.json()
      if (res.ok) {
        setClient(data.client)
        setHistory(data.history)
        setLoyalty(data.loyalty)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (clientId) load(clientId)
  }, [clientId, load])

  const open = !!clientId

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-charcoal-deep/70" onClick={onClose} />

      <div
        className={cn(
          'absolute top-0 right-0 h-full w-full max-w-[480px] bg-charcoal border-l border-offwhite/10',
          'overflow-y-auto transition-transform duration-300 ease-brand-out',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-charcoal border-b border-offwhite/[0.07]">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35">Cliente</p>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-[32px] h-[32px] flex items-center justify-center text-offwhite/40 hover:text-offwhite transition-colors border border-offwhite/[0.12] hover:border-offwhite/30"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          {loading && !client ? (
            <p className="font-body font-light text-[12px] text-offwhite/30 italic text-center py-10">Carregando…</p>
          ) : !client ? (
            <p className="font-body font-light text-[12px] text-error/60 italic text-center py-10">Não foi possível carregar o cliente.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-display font-light text-[22px] text-offwhite tracking-[0.02em] truncate">{client.name}</h2>
                  {client.vip && (
                    <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70 shrink-0">VIP</span>
                  )}
                </div>
                <EditClientButton
                  id={client.id}
                  name={client.name}
                  whatsapp={client.whatsapp}
                  email={client.email}
                  birthDate={client.birthDate}
                  onSaved={() => load(client.id)}
                />
              </div>

              <div className="space-y-[10px] mb-6">
                {[
                  { label: 'WhatsApp', value: client.whatsapp },
                  { label: 'E-mail', value: client.email ?? '—' },
                  { label: 'Data de nascimento', value: client.birthDate ? format(parseISO(client.birthDate), "d 'de' MMMM", { locale: ptBR }) : '—' },
                  { label: 'Visitas', value: `${history.filter(h => h.status === 'completed').length} concluídas / ${history.length} total` },
                  { label: 'Desde', value: format(parseISO(client.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/25 mb-[2px]">{label}</p>
                    <p className="font-body font-light text-[12px] text-offwhite/70">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <ClientActions id={client.id} vip={client.vip} notes={client.notes ?? ''} />
              </div>

              {loyalty && (
                <div className="mb-6">
                  <LoyaltyCard
                    clientId={client.id}
                    progress={loyalty.progress}
                    visitsRequired={loyalty.visitsRequired}
                    rewardDescription={loyalty.rewardDescription}
                    availableRewards={loyalty.availableRewards}
                  />
                </div>
              )}

              <h3 className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-4">
                Histórico de agendamentos
              </h3>

              {history.length === 0 ? (
                <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 text-center">
                  <p className="font-display font-light text-[15px] text-offwhite/[0.18] italic">Sem histórico.</p>
                </div>
              ) : (
                <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-light text-[12px] text-offwhite mb-[2px]">{h.serviceName}</p>
                        <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.12em]">
                          {h.date ? format(parseISO(h.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : '—'}
                          {h.startTime ? ` às ${h.startTime}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn('font-body font-light text-[8.5px] tracking-[0.2em] uppercase', STATUS_COLOR[h.status] ?? 'text-offwhite/35')}>
                          {STATUS_LABEL[h.status] ?? h.status}
                        </p>
                        {h.servicePrice != null && (
                          <p className="font-data text-[12px] text-offwhite/40 mt-[2px]">R$ {h.servicePrice}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

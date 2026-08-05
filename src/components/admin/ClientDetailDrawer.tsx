'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { refundPayment } from '@/app/admin/actions'
import { ClientActions } from './ClientActions'
import { EditClientButton } from './EditClientButton'
import { LoyaltyCard } from './LoyaltyCard'
import { ClientAvatar } from './ClientsTable'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

const DATE_FNS_LOCALE = { pt: ptBR, en: enUS, es }

interface ClientDetail {
  id: string
  name: string
  whatsapp: string
  email: string | null
  birthDate: string | null
  avatarUrl: string | null
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
  paymentId: string | null
  paymentNetAmount: number | null
  paymentRefundedAt: string | null
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
  completed: 'text-offwhite/55',
  cancelled: 'text-error/50',
  no_show:   'text-error/40',
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
  const { t, locale } = useTranslation()
  const dateLocale = DATE_FNS_LOCALE[locale]
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loyalty, setLoyalty] = useState<LoyaltyProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [refundingPaymentId, setRefundingPaymentId] = useState<string | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundError, setRefundError] = useState<string | null>(null)
  const [refunding, startRefundTransition] = useTransition()

  const handleRefund = (paymentId: string) => {
    if (!refundReason.trim()) { setRefundError(t.clients.detail.refundReasonRequired); return }
    startRefundTransition(async () => {
      const res = await refundPayment(paymentId, refundReason)
      if (res?.error) { setRefundError(res.error); return }
      setRefundingPaymentId(null)
      setRefundReason('')
      setRefundError(null)
      if (client) load(client.id)
    })
  }

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
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55">{t.clients.detail.eyebrow}</p>
          <button
            onClick={onClose}
            aria-label={t.clients.detail.close}
            className="w-[32px] h-[32px] flex items-center justify-center text-offwhite/55 hover:text-offwhite transition-colors border border-offwhite/[0.12] hover:border-offwhite/30"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="p-6">
          {loading && !client ? (
            <p className="font-body font-light text-[12px] text-offwhite/55 italic text-center py-10">{t.clients.detail.loading}</p>
          ) : !client ? (
            <p className="font-body font-light text-[12px] text-error/60 italic text-center py-10">{t.clients.detail.loadError}</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <ClientAvatar name={client.name} avatarUrl={client.avatarUrl} size={44} />
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-display font-light text-[22px] text-offwhite tracking-[0.02em] truncate">{client.name}</h2>
                    {client.vip && (
                      <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70 shrink-0">VIP</span>
                    )}
                  </div>
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
                  { label: t.clients.detail.whatsapp, value: client.whatsapp },
                  { label: t.clients.detail.email, value: client.email ?? '—' },
                  { label: t.clients.detail.birthDate, value: client.birthDate ? format(parseISO(client.birthDate), locale === 'pt' ? "d 'de' MMMM" : 'MMMM d', { locale: dateLocale }) : '—' },
                  { label: t.clients.detail.visitsLabel, value: t.clients.detail.visits(history.filter(h => h.status === 'completed').length, history.length) },
                  { label: t.clients.detail.since, value: format(parseISO(client.createdAt), locale === 'pt' ? "d 'de' MMMM 'de' yyyy" : 'MMMM d, yyyy', { locale: dateLocale }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="font-body font-light text-[7.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-[2px]">{label}</p>
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

              <h3 className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-4">
                {t.clients.detail.historyTitle}
              </h3>

              {history.length === 0 ? (
                <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6 text-center">
                  <p className="font-display font-light text-[15px] text-offwhite/55 italic">{t.clients.detail.noHistory}</p>
                </div>
              ) : (
                <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
                  {history.map(h => (
                    <div key={h.id} className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-light text-[12px] text-offwhite mb-[2px]">{h.serviceName}</p>
                          <p className="font-body font-light text-[9px] text-offwhite/55 tracking-[0.12em]">
                            {h.date ? format(parseISO(h.date), locale === 'pt' ? "d 'de' MMMM 'de' yyyy" : 'MMMM d, yyyy', { locale: dateLocale }) : '—'}
                            {h.startTime ? t.clients.detail.at(h.startTime) : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn('font-body font-light text-[8.5px] tracking-[0.2em] uppercase', STATUS_COLOR[h.status] ?? 'text-offwhite/55')}>
                            {t.dashboard.status[h.status as keyof typeof t.dashboard.status] ?? h.status}
                          </p>
                          {h.servicePrice != null && (
                            <p className="font-data text-[12px] text-offwhite/55 mt-[2px]">R$ {h.servicePrice}</p>
                          )}
                        </div>
                      </div>

                      {h.paymentId && (
                        <div className="mt-2 pt-2 border-t border-offwhite/[0.05]">
                          {h.paymentRefundedAt ? (
                            <p className="font-body font-light text-[8px] tracking-[0.2em] uppercase text-error/50">{t.clients.detail.paymentRefunded}</p>
                          ) : refundingPaymentId === h.paymentId ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                autoFocus
                                value={refundReason}
                                onChange={e => { setRefundReason(e.target.value); setRefundError(null) }}
                                placeholder={t.clients.detail.refundReasonPlaceholder}
                                className="flex-1 bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-body font-light text-[11px] px-2 py-1 outline-none focus:border-gold/50 transition-colors"
                              />
                              <button
                                disabled={refunding}
                                onClick={() => handleRefund(h.paymentId!)}
                                className="px-2 py-1 font-body font-medium text-[8px] tracking-[0.2em] uppercase bg-error text-offwhite hover:brightness-110 transition-all disabled:opacity-50 shrink-0"
                              >
                                {refunding ? '…' : t.clients.detail.confirm}
                              </button>
                              <button
                                onClick={() => { setRefundingPaymentId(null); setRefundReason(''); setRefundError(null) }}
                                className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/55 hover:text-offwhite/85 transition-colors shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRefundingPaymentId(h.paymentId)}
                              className="px-2 py-1 font-body font-medium text-[8px] tracking-[0.28em] uppercase bg-error text-offwhite hover:brightness-110 transition-all"
                            >
                              {t.clients.detail.refundPayment}
                            </button>
                          )}
                          {refundingPaymentId === h.paymentId && refundError && (
                            <p className="font-body font-light text-[8.5px] text-error/70 mt-1">{refundError}</p>
                          )}
                        </div>
                      )}
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

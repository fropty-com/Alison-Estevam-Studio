'use client'

import { useState, useTransition } from 'react'
import { advanceOrderStatus, cancelOrder } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { ClientAvatar } from './ClientsTable'

export interface OrderListItem {
  id: string
  referenceCode: string
  status: string
  fulfillmentMethod: 'envio' | 'retirada'
  total: number
  createdAt: string
  clientName: string
  clientAvatarUrl: string | null
  itemsSummary: string
}

const STATUS_DOT: Record<string, string> = {
  aguardando_pagamento: 'bg-gold',
  pago: 'bg-sage-light',
  preparando: 'bg-sage-light',
  enviado: 'bg-sage-light',
  pronto_retirada: 'bg-sage-light',
  concluido: 'bg-offwhite/40',
  cancelado: 'bg-error/60',
}

function nextStatusFor(status: string, fulfillmentMethod: string): string | null {
  if (status === 'pago') return 'preparando'
  if (status === 'preparando') return fulfillmentMethod === 'retirada' ? 'pronto_retirada' : 'enviado'
  if (status === 'enviado' || status === 'pronto_retirada') return 'concluido'
  return null
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const CANCELLABLE_STATUSES = ['pago', 'preparando', 'enviado', 'pronto_retirada']

export function OrderRow({ order }: { order: OrderListItem }) {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const next = nextStatusFor(order.status, order.fulfillmentMethod)
  const canCancel = CANCELLABLE_STATUSES.includes(order.status)

  const handleAdvance = () => {
    startTransition(async () => {
      const res = await advanceOrderStatus(order.id)
      if (res?.error) setFeedback(res.error)
      else setFeedback(null)
    })
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) return
    startTransition(async () => {
      const res = await cancelOrder(order.id, cancelReason)
      if (res?.error) setFeedback(res.error)
      else { setFeedback(null); setCancelling(false); setCancelReason('') }
    })
  }

  return (
    <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
      <div className="min-w-0 flex-1 flex items-center gap-3">
        <ClientAvatar name={order.clientName} avatarUrl={order.clientAvatarUrl} size={26} />
        <div className="min-w-0">
          <p className="font-body font-medium text-[12px] text-offwhite truncate">{order.clientName}</p>
          <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.05em] truncate">
            #{order.referenceCode} · {order.itemsSummary}
          </p>
        </div>
      </div>

      <span className="font-body font-light text-[9px] tracking-[0.15em] uppercase text-offwhite/55 w-[70px] shrink-0">
        {order.fulfillmentMethod === 'retirada' ? t.products.orders.pickup : t.products.orders.shipping}
      </span>

      <span className="font-data text-[13px] text-gold w-[90px] shrink-0 text-right">{fmt(order.total)}</span>

      <span className="font-body font-light text-[9px] text-offwhite/55 w-[76px] shrink-0">
        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
      </span>

      <div className="flex items-center gap-2 w-[150px] shrink-0">
        <span className={cn('w-[6px] h-[6px] rounded-full shrink-0', STATUS_DOT[order.status] ?? 'bg-offwhite/30')} />
        <span className="font-body font-light text-[10px] text-offwhite/60 tracking-[0.05em] truncate">
          {t.products.orders.statusLabel[order.status as keyof typeof t.products.orders.statusLabel] ?? order.status}
        </span>
      </div>

      <div className="w-[190px] shrink-0 flex flex-col items-end gap-1">
        {next ? (
          <button
            disabled={pending}
            onClick={handleAdvance}
            className="px-3 py-[7px] font-body font-light text-[8.5px] tracking-[0.18em] uppercase bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            {pending ? t.products.orders.advancing : t.products.orders.nextLabel[next as keyof typeof t.products.orders.nextLabel]}
          </button>
        ) : (
          <span className="font-body font-light text-[9px] text-offwhite/55 italic">{t.products.orders.cantAdvance}</span>
        )}
        {canCancel && !cancelling && (
          <button
            onClick={() => setCancelling(true)}
            className="px-2 py-1 font-body font-medium text-[8px] tracking-[0.15em] uppercase bg-error text-offwhite hover:brightness-110 transition-all"
          >
            {t.products.orders.cancel}
          </button>
        )}
      </div>

      {cancelling && (
        <div className="w-full flex items-center gap-2 pt-1">
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder={t.products.orders.cancelReasonPlaceholder}
            className="flex-1 min-w-[140px] bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-body font-light text-[11px] px-2 py-[6px] outline-none focus:border-error/40 transition-colors placeholder:text-offwhite/55"
          />
          <button
            disabled={pending || !cancelReason.trim()}
            onClick={handleCancel}
            className="px-2 py-1 font-body font-medium text-[8px] tracking-[0.18em] uppercase bg-error text-offwhite hover:brightness-110 transition-all disabled:opacity-40 whitespace-nowrap"
          >
            {pending ? t.products.orders.cancelling : t.products.orders.cancelConfirm}
          </button>
          <button
            onClick={() => { setCancelling(false); setCancelReason('') }}
            className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/55 hover:text-offwhite/85 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {feedback && <p className="w-full font-body font-light text-[8.5px] tracking-[0.18em] text-error/70">{feedback}</p>}
    </div>
  )
}

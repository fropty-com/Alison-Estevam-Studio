'use client'

import { useState, useTransition } from 'react'
import { updateAppointmentStatus, addAppointmentNote, checkInAppointment, checkOutAppointment } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export function AppointmentActions({ id, status, notes, totalPrice }: { id: string; status: string; notes?: string | null; totalPrice: number }) {
  const { t } = useTranslation()
  const PAYMENT_METHODS: { value: 'cash' | 'pix' | 'debit_card' | 'credit_card' | 'courtesy'; label: string }[] = [
    { value: 'cash',        label: t.agenda.actions.paymentMethods.cash },
    { value: 'pix',         label: t.agenda.actions.paymentMethods.pix },
    { value: 'debit_card',  label: t.agenda.actions.paymentMethods.debit_card },
    { value: 'credit_card', label: t.agenda.actions.paymentMethods.credit_card },
    { value: 'courtesy',    label: t.agenda.actions.paymentMethods.courtesy },
  ]
  const [pending, startTransition] = useTransition()
  const [showNote,    setShowNote]    = useState(false)
  const [noteText,    setNoteText]    = useState(notes ?? '')
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [checkoutForm, setCheckoutForm] = useState(false)
  const [method,   setMethod]   = useState<typeof PAYMENT_METHODS[number]['value']>('pix')
  const [discount, setDiscount] = useState('0')
  const [tip,      setTip]      = useState('0')
  const [feedback, setFeedback] = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else setFeedback(null)
    })
  }

  const discountValue = Math.max(0, Number(discount.replace(',', '.')) || 0)
  const tipValue       = Math.max(0, Number(tip.replace(',', '.')) || 0)
  const finalValue     = Math.max(0, totalPrice - discountValue) + tipValue

  return (
    <div className="mt-3 space-y-2">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {status === 'pending' && (
          <button
            disabled={pending}
            onClick={() => act(() => updateAppointmentStatus(id, 'confirmed'))}
            className={cn(
              'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
              'bg-sage/15 border border-sage/30 text-sage-light',
              'hover:bg-sage/25 transition-all duration-200 disabled:opacity-40'
            )}
          >
            {t.agenda.actions.confirm}
          </button>
        )}

        {status === 'confirmed' && (
          <button
            disabled={pending}
            onClick={() => act(() => checkInAppointment(id))}
            className={cn(
              'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
              'bg-gold/15 border border-gold/30 text-gold',
              'hover:bg-gold/20 transition-all duration-200 disabled:opacity-40'
            )}
          >
            {t.agenda.actions.checkIn}
          </button>
        )}

        {status === 'checked_in' && (
          <button
            disabled={pending}
            onClick={() => setCheckoutForm(v => !v)}
            className={cn(
              'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
              'bg-gold/15 border border-gold/30 text-gold',
              'hover:bg-gold/20 transition-all duration-200 disabled:opacity-40'
            )}
          >
            {checkoutForm ? t.agenda.actions.close : t.agenda.actions.checkOut}
          </button>
        )}

        {(status === 'pending' || status === 'confirmed') && (
          <button
            disabled={pending}
            onClick={() => setCancelModal(true)}
            className={cn(
              'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
              'bg-error/5 border border-error/20 text-error/60',
              'hover:bg-error/10 transition-all duration-200 disabled:opacity-40'
            )}
          >
            {t.agenda.actions.cancel}
          </button>
        )}

        <button
          onClick={() => setShowNote(v => !v)}
          className={cn(
            'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
            'border border-offwhite/10 text-offwhite/30',
            'hover:border-offwhite/25 hover:text-offwhite/55 transition-all duration-200'
          )}
        >
          {showNote ? t.agenda.actions.closeNote : t.agenda.actions.note}
        </button>
      </div>

      {/* Checkout / payment form */}
      {checkoutForm && (
        <div className="bg-gold/5 border border-gold/20 p-4 space-y-3">
          <p className="font-body font-light text-[9px] tracking-[0.22em] uppercase text-gold/80">
            {t.agenda.actions.registerPayment}
          </p>

          <div className="flex flex-wrap gap-[6px]">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                className={cn(
                  'px-3 py-[6px] font-body font-light text-[9px] tracking-[0.12em]',
                  'border transition-all duration-200',
                  method === m.value
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-offwhite/[0.12] text-offwhite/45 hover:border-offwhite/25'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="font-body font-light text-[9px] tracking-[0.18em] uppercase text-offwhite/35 shrink-0">
              {t.agenda.actions.discount}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={discount}
              onChange={e => setDiscount(e.target.value)}
              className="w-24 bg-offwhite/5 border border-offwhite/[0.09] text-offwhite/80 font-data text-lg px-3 py-[6px] outline-none rounded-none focus:border-gold/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="font-body font-light text-[9px] tracking-[0.18em] uppercase text-offwhite/35 shrink-0">
              {t.agenda.actions.tip}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={tip}
              onChange={e => setTip(e.target.value)}
              className="w-24 bg-offwhite/5 border border-offwhite/[0.09] text-offwhite/80 font-data text-lg px-3 py-[6px] outline-none rounded-none focus:border-gold/40 transition-colors"
            />
          </div>

          <p className="font-body font-light text-[11px] text-offwhite/55">
            {t.agenda.actions.finalValue} <span className="font-data text-gold">R$ {finalValue.toFixed(2)}</span>
          </p>

          <button
            disabled={pending}
            onClick={() => act(() => checkOutAppointment(id, { method, grossAmount: totalPrice, discount: discountValue, tipAmount: tipValue }))}
            className="px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-gold/20 border border-gold/40 text-gold hover:bg-gold/30 transition-all duration-200 disabled:opacity-40"
          >
            {pending ? t.agenda.actions.registering : t.agenda.actions.confirmPayment}
          </button>
        </div>
      )}

      {/* Note editor */}
      {showNote && (
        <div className="space-y-2">
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={2}
            placeholder={t.agenda.actions.notePlaceholder}
            className={cn(
              'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite/80',
              'font-body font-light text-lg px-3 py-2 outline-none rounded-none resize-none',
              'focus:border-gold/50 transition-colors placeholder:text-offwhite/20'
            )}
          />
          <button
            disabled={pending}
            onClick={() => act(() => addAppointmentNote(id, noteText))}
            className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-sage/15 border border-sage/25 text-sage-light hover:bg-sage/25 transition-all duration-200 disabled:opacity-40"
          >
            {pending ? t.agenda.actions.saving : t.agenda.actions.saveNote}
          </button>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="bg-error/5 border border-error/20 p-4 space-y-2">
          <p className="font-body font-light text-[9px] tracking-[0.22em] uppercase text-error/70">
            {t.agenda.actions.cancelReasonLabel}
          </p>
          <input
            type="text"
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder={t.agenda.actions.cancelReasonPlaceholder}
            className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite/80 font-body font-light text-lg px-3 py-2 outline-none rounded-none focus:border-error/40 transition-colors placeholder:text-offwhite/20"
          />
          <div className="flex gap-2">
            <button
              disabled={pending}
              onClick={() => {
                setCancelModal(false)
                act(() => updateAppointmentStatus(id, 'cancelled', cancelReason || undefined))
              }}
              className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-error/15 border border-error/25 text-error/70 hover:bg-error/50 transition-all duration-200 disabled:opacity-40"
            >
              {t.agenda.actions.confirmCancel}
            </button>
            <button
              onClick={() => setCancelModal(false)}
              className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.28em] uppercase border border-offwhite/10 text-offwhite/30 hover:text-offwhite/55 transition-colors"
            >
              {t.agenda.actions.back}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70">{feedback}</p>
      )}
    </div>
  )
}

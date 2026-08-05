'use client'

import { useEffect } from 'react'
import { AppointmentActions } from './AppointmentActions'
import { ClientAvatar } from './ClientsTable'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'

export interface DetailAppointment {
  id: string
  referenceCode: string
  status: string
  notes: string | null
  totalPrice: number
  timeLabel: string
  durationLabel: string
  clientName: string
  clientWhatsapp: string
  clientAvatarUrl: string | null
  clientVip: boolean
  serviceName: string
  servicePrice: number | null
  checkedInAt: string | null
}

/** Slide-over panel on desktop, bottom sheet on mobile — shows one appointment's full detail + actions on top of the day grid. */
export function AppointmentDetailSheet({ appt, onClose }: { appt: DetailAppointment; onClose: () => void }) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-charcoal-deep/60 animate-fade-up"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed z-50 bg-charcoal border-offwhite/10 overflow-y-auto animate-fade-up',
          'inset-x-0 bottom-0 max-h-[85vh] border-t',
          'md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:max-h-none md:w-[420px] md:border-t-0 md:border-l',
        )}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-offwhite/[0.08]">
          <div>
            <p className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/55 mb-1">
              {t.dashboard.status[appt.status as keyof typeof t.dashboard.status] ?? appt.status}
            </p>
            <p className="font-data text-[22px] text-offwhite/80 leading-none">{appt.timeLabel}</p>
            <p className="font-body font-light text-[8px] text-offwhite/55 mt-1 tracking-[0.15em]">{appt.durationLabel}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.agenda.close}
            className="w-[36px] h-[36px] border border-offwhite/[0.18] text-offwhite/55 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-3">
            <ClientAvatar name={appt.clientName} avatarUrl={appt.clientAvatarUrl} size={38} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-[3px]">
                <p className="font-body font-light text-[16px] text-offwhite truncate">{appt.clientName}</p>
                {appt.clientVip && (
                  <span className="font-body font-light text-[7.5px] tracking-[0.3em] uppercase px-[7px] py-[3px] bg-gold/10 border border-gold/25 text-gold/70 shrink-0">{t.agenda.detail.vip}</span>
                )}
              </div>
              <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.15em] mb-[2px]">
                {appt.serviceName}{appt.servicePrice ? ` · R$ ${appt.servicePrice}` : ''}
              </p>
              <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.1em]">
                {appt.clientWhatsapp} · #{appt.referenceCode}
                {appt.checkedInAt && t.agenda.detail.checkedInAt(appt.checkedInAt)}
              </p>
            </div>
          </div>

          <AppointmentActions
            id={appt.id}
            status={appt.status}
            notes={appt.notes}
            totalPrice={appt.totalPrice}
          />
        </div>
      </div>
    </>
  )
}

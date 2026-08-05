'use client'

import { useTransition } from 'react'
import { updateWaitlistStatus } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { ClientAvatar } from './ClientsTable'

export function WaitlistEntryRow({
  id,
  clientName,
  clientWhatsapp,
  clientAvatarUrl,
  serviceName,
  note,
  status,
  notifyUrl,
}: {
  id: string
  clientName: string
  clientWhatsapp: string
  clientAvatarUrl: string | null
  serviceName: string
  note: string | null
  status: 'waiting' | 'notified'
  notifyUrl: string
}) {
  const { t } = useTranslation()
  const [pending, startTransition] = useTransition()

  const act = (next: 'notified' | 'resolved' | 'cancelled') => {
    startTransition(async () => { await updateWaitlistStatus(id, next) })
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <ClientAvatar name={clientName} avatarUrl={clientAvatarUrl} size={30} />
      <div className="flex-1 min-w-0">
        <p className="font-body font-light text-[12.5px] text-offwhite/80">
          {clientName} <span className="text-offwhite/55">· {clientWhatsapp}</span>
        </p>
        <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.08em] mt-[3px]">
          {serviceName}
        </p>
        {note && (
          <p className="font-body font-light text-[10px] text-offwhite/55 italic mt-[3px]">{note}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-[6px] shrink-0">
        <a
          href={notifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => status === 'waiting' && act('notified')}
          className={cn(
            'px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase',
            'bg-sage/15 border border-sage/30 text-sage-light',
            'hover:bg-sage/25 transition-all duration-200'
          )}
        >
          {status === 'notified' ? t.waitlist.notifyAgain : t.waitlist.notify}
        </a>
        <button
          disabled={pending}
          onClick={() => act('resolved')}
          className="px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase border border-offwhite/10 text-offwhite/55 hover:border-offwhite/25 hover:text-offwhite/85 transition-all duration-200 disabled:opacity-40"
        >
          {t.waitlist.scheduled}
        </button>
        <button
          disabled={pending}
          onClick={() => act('cancelled')}
          className="px-3 py-[7px] font-body font-medium text-[8px] tracking-[0.28em] uppercase bg-error text-offwhite hover:brightness-110 transition-all duration-200 disabled:opacity-40"
        >
          {t.waitlist.remove}
        </button>
      </div>
    </div>
  )
}

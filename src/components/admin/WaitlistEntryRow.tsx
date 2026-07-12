'use client'

import { useTransition } from 'react'
import { updateWaitlistStatus } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function WaitlistEntryRow({
  id,
  clientName,
  clientWhatsapp,
  serviceName,
  note,
  status,
  notifyUrl,
}: {
  id: string
  clientName: string
  clientWhatsapp: string
  serviceName: string
  note: string | null
  status: 'waiting' | 'notified'
  notifyUrl: string
}) {
  const [pending, startTransition] = useTransition()

  const act = (next: 'notified' | 'resolved' | 'cancelled') => {
    startTransition(async () => { await updateWaitlistStatus(id, next) })
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="font-body font-light text-[12.5px] text-offwhite/80">
          {clientName} <span className="text-offwhite/30">· {clientWhatsapp}</span>
        </p>
        <p className="font-body font-light text-[10px] text-offwhite/40 tracking-[0.08em] mt-[3px]">
          {serviceName}
        </p>
        {note && (
          <p className="font-body font-light text-[10px] text-offwhite/30 italic mt-[3px]">{note}</p>
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
            'bg-sage/12 border border-sage/30 text-sage-light',
            'hover:bg-sage/22 transition-all duration-200'
          )}
        >
          {status === 'notified' ? 'Notificar de novo' : 'Notificar'}
        </a>
        <button
          disabled={pending}
          onClick={() => act('resolved')}
          className="px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase border border-offwhite/10 text-offwhite/30 hover:border-offwhite/25 hover:text-offwhite/55 transition-all duration-200 disabled:opacity-40"
        >
          Agendou
        </button>
        <button
          disabled={pending}
          onClick={() => act('cancelled')}
          className="px-3 py-[7px] font-body font-light text-[8px] tracking-[0.28em] uppercase bg-error/5 border border-error/20 text-error/60 hover:bg-error/10 transition-all duration-200 disabled:opacity-40"
        >
          Remover
        </button>
      </div>
    </div>
  )
}

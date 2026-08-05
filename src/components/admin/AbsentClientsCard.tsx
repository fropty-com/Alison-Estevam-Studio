'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { ClientAvatar } from './ClientsTable'

interface Absence {
  id: string
  name: string
  avatarUrl: string | null
  daysSinceLast: number
  avgGap: number
}

const THRESHOLDS = [15, 30] as const

export function AbsentClientsCard({ absences }: { absences: Absence[] }) {
  const { t } = useTranslation()
  const [threshold, setThreshold] = useState<typeof THRESHOLDS[number]>(30)
  const filtered = absences.filter(a => a.daysSinceLast >= threshold)

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55">
          {t.clients.absent.title}
        </p>
        <div className="flex gap-[6px]">
          {THRESHOLDS.map(th => (
            <button
              key={th}
              type="button"
              onClick={() => setThreshold(th)}
              className={cn(
                'px-3 py-[5px] font-body font-light text-[9px] tracking-[0.1em] transition-all duration-150',
                threshold === th
                  ? 'bg-error text-offwhite'
                  : 'border border-offwhite/[0.14] text-offwhite/55 hover:border-offwhite/30'
              )}
            >
              {t.clients.absent.daysSuffix(th)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">
          {t.clients.absent.none(threshold)}
        </p>
      ) : (
        <div className="divide-y divide-offwhite/6 -mx-6">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-offwhite/5 transition-colors"
            >
              <span className="flex items-center gap-3 min-w-0">
                <ClientAvatar name={c.name} avatarUrl={c.avatarUrl} size={26} />
                <span className="font-body font-light text-[12px] text-offwhite/70 truncate">{c.name}</span>
              </span>
              <span className="shrink-0 font-body font-light text-[9px] text-offwhite/55 tracking-[0.1em]">
                {t.clients.absent.daysSinceLast(c.daysSinceLast)} <span className="text-offwhite/55">{t.clients.absent.usuallyReturns(c.avgGap)}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

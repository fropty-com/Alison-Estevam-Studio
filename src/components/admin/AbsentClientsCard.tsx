'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Absence {
  id: string
  name: string
  daysSinceLast: number
  avgGap: number
}

const THRESHOLDS = [15, 30] as const

export function AbsentClientsCard({ absences }: { absences: Absence[] }) {
  const [threshold, setThreshold] = useState<typeof THRESHOLDS[number]>(30)
  const filtered = absences.filter(a => a.daysSinceLast >= threshold)

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35">
          Clientes ausentes
        </p>
        <div className="flex gap-[6px]">
          {THRESHOLDS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setThreshold(t)}
              className={cn(
                'px-3 py-[5px] font-body font-light text-[9px] tracking-[0.1em] transition-all duration-150',
                threshold === t
                  ? 'bg-error text-offwhite'
                  : 'border border-offwhite/[0.14] text-offwhite/45 hover:border-offwhite/30'
              )}
            >
              {t} dias
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">
          Nenhum cliente ausente há {threshold}+ dias.
        </p>
      ) : (
        <div className="divide-y divide-offwhite/6 -mx-6">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-offwhite/5 transition-colors"
            >
              <span className="font-body font-light text-[12px] text-offwhite/70">{c.name}</span>
              <span className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em]">
                {c.daysSinceLast}d sem voltar <span className="text-offwhite/[0.18]">· costuma voltar a cada {c.avgGap}d</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

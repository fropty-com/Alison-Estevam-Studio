'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export function AccordionSection({
  icon,
  label,
  badge,
  defaultOpen = false,
  children,
}: {
  icon: string
  label: string
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-offwhite/6 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-6 py-5 text-left hover:bg-offwhite/[0.03] transition-colors"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="font-body font-light text-[13px] text-offwhite/40 shrink-0" aria-hidden="true">{icon}</span>
          <span className="font-body font-light text-[13px] text-offwhite/75 truncate">{label}</span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          {badge}
          <span
            className={cn('font-body font-light text-[10px] text-offwhite/25 transition-transform duration-200', open && 'rotate-180')}
            aria-hidden="true"
          >
            ⌄
          </span>
        </span>
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-brand-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="px-6 pb-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

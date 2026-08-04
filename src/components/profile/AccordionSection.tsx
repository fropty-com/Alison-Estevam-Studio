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
    <div className="bg-offwhite/5 border border-offwhite/[0.07]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-6 py-5 text-left transition-colors',
          open ? 'bg-gold/[0.07]' : 'hover:bg-gold/[0.04]'
        )}
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="font-body font-light text-[13px] text-gold/60 shrink-0" aria-hidden="true">{icon}</span>
          <span className="font-body font-light text-[13px] text-offwhite/85 truncate">{label}</span>
        </span>
        <span className="flex items-center gap-3 shrink-0">
          {badge}
          <span
            className={cn('font-body font-light text-[10px] text-gold/50 transition-transform duration-200', open && 'rotate-180')}
            aria-hidden="true"
          >
            ⌄
          </span>
        </span>
      </button>
      <div className={cn('grid transition-[grid-template-rows] duration-300 ease-brand-out', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className="px-6 pb-6 border-t border-offwhite/[0.06]">{children}</div>
        </div>
      </div>
    </div>
  )
}

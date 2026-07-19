'use client'

import { useState } from 'react'
import { BlockTimeModal } from './BlockTimeModal'

export function BlockTimeButton({
  date,
  gridStartMin,
  gridEndMin,
  hasRule,
}: {
  date: string
  gridStartMin: number
  gridEndMin: number
  hasRule: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        disabled={!hasRule}
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap px-4 h-[36px] border border-offwhite/18 font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/45 transition-all duration-200 hover:border-offwhite/40 hover:text-offwhite disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Bloquear horário
      </button>
      {open && (
        <BlockTimeModal
          date={date}
          gridStartMin={gridStartMin}
          gridEndMin={gridEndMin}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

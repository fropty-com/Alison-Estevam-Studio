'use client'

import { useState } from 'react'
import { NewAppointmentModal } from './NewAppointmentModal'

function PlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <line x1="5" y1="0.5" x2="5" y2="9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function NewAppointmentButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap flex items-center gap-[7px] px-4 h-[36px] bg-gold font-body font-medium text-[8px] tracking-[0.28em] uppercase text-charcoal-deep hover:bg-gold-light transition-all duration-200"
      >
        <PlusIcon />
        Agendar
      </button>
      {open && <NewAppointmentModal onClose={() => setOpen(false)} />}
    </>
  )
}

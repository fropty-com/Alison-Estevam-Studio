'use client'

import { useState } from 'react'
import { NewAppointmentModal } from './NewAppointmentModal'

export function NewAppointmentButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 h-9 border border-gold/35 font-body font-light text-[8px] tracking-[0.28em] uppercase text-gold/80 hover:bg-gold/10 hover:border-gold/55 transition-all duration-200"
      >
        + Novo agendamento
      </button>
      {open && <NewAppointmentModal onClose={() => setOpen(false)} />}
    </>
  )
}

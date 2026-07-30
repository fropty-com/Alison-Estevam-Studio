'use client'

import { useState } from 'react'
import { EditClientModal } from './EditClientModal'

export function EditClientButton({
  id,
  name,
  whatsapp,
  email,
  birthDate,
  onSaved,
}: {
  id: string
  name: string
  whatsapp: string
  email: string | null
  birthDate?: string | null
  onSaved?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 whitespace-nowrap px-3 h-[28px] font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/35 border border-offwhite/[0.12] hover:border-gold/35 hover:text-gold/[0.75] transition-all duration-200"
      >
        Editar
      </button>
      {open && (
        <EditClientModal
          id={id}
          name={name}
          whatsapp={whatsapp}
          email={email}
          birthDate={birthDate}
          onClose={() => { setOpen(false); onSaved?.() }}
        />
      )}
    </>
  )
}

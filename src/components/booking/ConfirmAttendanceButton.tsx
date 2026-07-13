'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { confirmAppointmentAction } from '@/app/conta/actions'

export function ConfirmAttendanceButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await confirmAppointmentAction(appointmentId)
      if (result.error) setError(result.error)
      else router.refresh()
    })
  }

  return (
    <div className="mt-[10px]">
      <button
        onClick={handleClick}
        disabled={pending}
        className="w-full text-center px-3 py-[10px] font-body font-medium text-[8.5px] tracking-[0.25em] uppercase bg-gold/15 border border-gold/45 text-gold hover:bg-gold/25 hover:border-gold/65 transition-all duration-200 disabled:opacity-50"
      >
        {pending ? 'Confirmando…' : 'Confirmar presença'}
      </button>
      {error && (
        <p className="font-body font-light text-[9px] tracking-[0.1em] text-error/80 mt-[6px]">{error}</p>
      )}
    </div>
  )
}

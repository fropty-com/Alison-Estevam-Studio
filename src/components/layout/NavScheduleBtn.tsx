'use client'

import { useBookingModal } from '@/hooks/useBookingModal'
import { useEffect } from 'react'

/**
 * Wires the booking modal to "Agendar" buttons across the site via context.
 * We can't pass props from a Server layout to a Client Nav directly,
 * so this component bridges the gap.
 *
 * Dispatch `new CustomEvent('open-booking', { detail: { serviceSlug } })`
 * to open the modal with that service already selected, or a plain
 * `new Event('open-booking')` to start at the service-picker step.
 */
export function NavScheduleBtn() {
  const { open } = useBookingModal()

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ serviceSlug?: string }>).detail
      open(detail?.serviceSlug)
    }
    window.addEventListener('open-booking', handler)
    return () => window.removeEventListener('open-booking', handler)
  }, [open])

  return null
}

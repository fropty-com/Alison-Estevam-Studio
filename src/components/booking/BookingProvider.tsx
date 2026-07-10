'use client'

import { BookingModalContext, useBookingModalState } from '@/hooks/useBookingModal'
import { BookingModal } from './BookingModal'

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, presetServiceSlug, open, close } = useBookingModalState()

  return (
    <BookingModalContext.Provider value={{ isOpen, presetServiceSlug, open, close }}>
      {children}
      <BookingModal isOpen={isOpen} presetServiceSlug={presetServiceSlug} onClose={close} />
    </BookingModalContext.Provider>
  )
}

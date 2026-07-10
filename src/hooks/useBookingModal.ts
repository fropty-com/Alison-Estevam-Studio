'use client'

import { useContext, createContext, useState, useCallback } from 'react'

interface BookingModalCtx {
  isOpen: boolean
  presetServiceSlug: string | null
  open:   (serviceSlug?: string) => void
  close:  () => void
}

export const BookingModalContext = createContext<BookingModalCtx>({
  isOpen: false,
  presetServiceSlug: null,
  open:   () => {},
  close:  () => {},
})

export function useBookingModal() {
  return useContext(BookingModalContext)
}

export function useBookingModalState() {
  const [isOpen, setIsOpen] = useState(false)
  const [presetServiceSlug, setPresetServiceSlug] = useState<string | null>(null)

  const open = useCallback((serviceSlug?: string) => {
    setPresetServiceSlug(serviceSlug ?? null)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => setIsOpen(false), [])

  return { isOpen, presetServiceSlug, open, close }
}

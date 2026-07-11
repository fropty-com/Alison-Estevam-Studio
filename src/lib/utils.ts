import { clsx, type ClassValue } from 'clsx'
import { BOOKING } from '@/config/booking'

/**
 * Utility functions — pure, tested, documented.
 */

/**
 * Class name merger — combines Tailwind classes safely.
 * Thin wrapper; avoids adding tailwind-merge for now.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}

/**
 * Generate a human-readable reference code.
 * Format: AE-2026-0042
 */
export function generateReferenceCode(sequence: number): string {
  const year = new Date().getFullYear()
  const padded = String(sequence).padStart(4, '0')
  return `${BOOKING.referencePrefix}-${year}-${padded}`
}

/**
 * Format a WhatsApp number to E.164 format (+5511...)
 */
export function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('55')) return `+${digits}`
  if (digits.length === 11) return `+55${digits}`
  return `+55${digits}`
}

/**
 * Format a price in BRL currency. Complements with no fixed price
 * (negotiated at time of service) store price as null.
 */
export function formatCurrency(value: number | null): string {
  if (value === null) return 'A definir'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value)
}

/**
 * Format HH:mm time to display format (09h00).
 */
export function formatTimeDisplay(time: string): string {
  return time.replace(':', 'h')
}

/**
 * Check if a date is in the past.
 */
export function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Check if cancellation is still allowed for an appointment.
 */
export function canCancelAppointment(slotDate: string, slotTime: string): boolean {
  const appointmentDateTime = new Date(`${slotDate}T${slotTime}:00`)
  const now = new Date()
  const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntil >= BOOKING.cancellationWindowHours
}

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
 * Format a Brazilian WhatsApp number to E.164 (+5511987654321).
 * A valid Brazilian mobile number is always DDD (2 digits) + 9 + 8 digits = 11 local
 * digits — the "nono dígito" has been mandatory nationwide since 2016. Anything else
 * (10 digits, a stray extra digit, etc.) is rejected here instead of being silently
 * accepted, which previously created duplicate client records for the same phone
 * number typed slightly differently.
 */
export function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const local =
    digits.length === 11 ? digits
    : digits.startsWith('55') && digits.length === 13 ? digits.slice(2)
    : null

  if (!local) {
    throw new Error('Número de WhatsApp inválido. Informe o DDD + 9 dígitos (ex: 11987654321).')
  }
  return `+55${local}`
}

/**
 * Requires at least a first and last name — a lone first name isn't enough
 * to tell clients apart (more than one "João" can book with the same
 * barbeiro), so this is enforced everywhere a client's name is collected.
 */
export function isFullName(name: string): boolean {
  return name.trim().split(/\s+/).filter(Boolean).length >= 2
}

/** True if `raw` normalizes to a valid Brazilian WhatsApp number. */
export function isValidWhatsApp(raw: string): boolean {
  try {
    formatWhatsApp(raw)
    return true
  } catch {
    return false
  }
}

/**
 * Live input mask for a Brazilian phone number: "(11) 98765-4321".
 * The country code is never typed — formatWhatsApp() adds +55 once the
 * value is submitted. Caps at 11 digits (DDD + 9-digit mobile number).
 */
export function maskPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
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

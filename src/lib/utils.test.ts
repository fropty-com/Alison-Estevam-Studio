import { describe, it, expect } from 'vitest'
import {
  formatWhatsApp,
  isValidWhatsApp,
  maskPhoneInput,
  formatCurrency,
  formatTimeDisplay,
  isPastDate,
  canCancelAppointment,
} from './utils'

describe('formatWhatsApp', () => {
  it('formats 11 local digits to E.164', () => {
    expect(formatWhatsApp('11987654321')).toBe('+5511987654321')
  })

  it('accepts digits already prefixed with 55', () => {
    expect(formatWhatsApp('5511987654321')).toBe('+5511987654321')
  })

  it('strips formatting characters before validating', () => {
    expect(formatWhatsApp('(11) 98765-4321')).toBe('+5511987654321')
  })

  it('rejects a 10-digit number missing the nono digito', () => {
    // This is the exact bug that previously created duplicate client records.
    expect(() => formatWhatsApp('1187654321')).toThrow()
  })

  it('rejects garbage input', () => {
    expect(() => formatWhatsApp('abc')).toThrow()
    expect(() => formatWhatsApp('')).toThrow()
  })
})

describe('isValidWhatsApp', () => {
  it('mirrors formatWhatsApp validity without throwing', () => {
    expect(isValidWhatsApp('11987654321')).toBe(true)
    expect(isValidWhatsApp('1187654321')).toBe(false)
  })
})

describe('maskPhoneInput', () => {
  it('builds up the mask progressively as digits are typed', () => {
    expect(maskPhoneInput('')).toBe('')
    expect(maskPhoneInput('1')).toBe('(1')
    expect(maskPhoneInput('11')).toBe('(11')
    expect(maskPhoneInput('119876')).toBe('(11) 9876')
    expect(maskPhoneInput('11987654321')).toBe('(11) 98765-4321')
  })

  it('ignores non-digit characters and caps at 11 digits', () => {
    expect(maskPhoneInput('(11) 98765-4321999')).toBe('(11) 98765-4321')
  })
})

describe('formatCurrency', () => {
  it('formats a number as BRL with no decimal places', () => {
    expect(formatCurrency(70)).toBe('R$ 70')
  })

  it('renders null as "A definir" (negotiated complements)', () => {
    expect(formatCurrency(null)).toBe('A definir')
  })
})

describe('formatTimeDisplay', () => {
  it('replaces the colon with h', () => {
    expect(formatTimeDisplay('09:00')).toBe('09h00')
  })
})

// Formats using local getters (not toISOString, which is UTC) so the
// resulting date/time strings round-trip correctly through `new Date(local)`.
function localDateTimeParts(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { date, time }
}

describe('isPastDate', () => {
  it('flags yesterday as past and tomorrow as not past', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    expect(isPastDate(localDateTimeParts(yesterday).date)).toBe(true)
    expect(isPastDate(localDateTimeParts(tomorrow).date)).toBe(false)
  })
})

describe('canCancelAppointment', () => {
  it('allows cancellation when the appointment is more than 24h away', () => {
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000)
    const { date, time } = localDateTimeParts(future)
    expect(canCancelAppointment(date, time)).toBe(true)
  })

  it('blocks cancellation inside the 24h window', () => {
    const soon = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const { date, time } = localDateTimeParts(soon)
    expect(canCancelAppointment(date, time)).toBe(false)
  })
})

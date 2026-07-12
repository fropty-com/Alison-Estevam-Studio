import { describe, it, expect } from 'vitest'
import { createAppointmentSchema, joinWaitlistSchema, cancelAppointmentSchema } from './booking'

const validAppointment = {
  name: 'Fulano de Tal',
  whatsapp: '(11) 98765-4321',
  serviceId: '11111111-1111-1111-1111-111111111111',
  slotId: '22222222-2222-2222-2222-222222222222',
}

describe('createAppointmentSchema', () => {
  it('accepts a valid payload and normalizes whatsapp to digits', () => {
    const result = createAppointmentSchema.safeParse(validAppointment)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.whatsapp).toBe('11987654321')
  })

  it('rejects a whatsapp number with only 10 digits', () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, whatsapp: '(11) 8765-4321' })
    expect(result.success).toBe(false)
  })

  it('rejects a name shorter than 2 characters', () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, name: 'A' })
    expect(result.success).toBe(false)
  })

  it('rejects a single-word name — full name is required to tell clients apart', () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, name: 'Fulano' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-uuid serviceId', () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, serviceId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('allows email and couponCode to be omitted', () => {
    const result = createAppointmentSchema.safeParse(validAppointment)
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email when provided', () => {
    const result = createAppointmentSchema.safeParse({ ...validAppointment, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('defaults complementIds to an empty array', () => {
    const result = createAppointmentSchema.safeParse(validAppointment)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.complementIds).toEqual([])
  })
})

describe('joinWaitlistSchema', () => {
  const valid = {
    name: 'Fulano de Tal',
    whatsapp: '(11) 98765-4321',
    serviceId: '11111111-1111-1111-1111-111111111111',
    preferredDate: '2026-07-20',
  }

  it('accepts a valid payload', () => {
    expect(joinWaitlistSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a malformed date', () => {
    expect(joinWaitlistSchema.safeParse({ ...valid, preferredDate: '20/07/2026' }).success).toBe(false)
  })

  it('rejects an invalid whatsapp number', () => {
    expect(joinWaitlistSchema.safeParse({ ...valid, whatsapp: '123' }).success).toBe(false)
  })
})

describe('cancelAppointmentSchema', () => {
  it('accepts an appointment id with no reason', () => {
    const result = cancelAppointmentSchema.safeParse({ appointmentId: '11111111-1111-1111-1111-111111111111' })
    expect(result.success).toBe(true)
  })

  it('rejects a non-uuid appointmentId', () => {
    const result = cancelAppointmentSchema.safeParse({ appointmentId: 'nope' })
    expect(result.success).toBe(false)
  })
})

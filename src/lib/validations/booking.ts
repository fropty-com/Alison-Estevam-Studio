import { z } from 'zod'

/**
 * Validation schemas — Zod schemas shared between client and server.
 * One source of truth for all form validation rules.
 */

// Requires first + last name — more than one client can share a first name.
const clientNameSchema = z
  .string()
  .min(2, 'Nome precisa ter pelo menos 2 caracteres.')
  .max(100, 'Nome muito longo.')
  .refine(v => v.trim().split(/\s+/).filter(Boolean).length >= 2, 'Informe nome e sobrenome.')

export const createAppointmentSchema = z.object({
  name: clientNameSchema,

  whatsapp: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(
      z.string().regex(/^(55)?\d{11}$/, 'WhatsApp inválido. Informe o DDD + 9 dígitos.')
    ),

  email: z
    .string()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('')),

  serviceId: z
    .string()
    .uuid('Serviço inválido.'),

  slotId: z
    .string()
    .uuid('Horário inválido.'),

  complementIds: z
    .array(z.string().uuid())
    .max(10)
    .optional()
    .default([]),

  couponCode: z
    .string()
    .max(30)
    .optional()
    .or(z.literal('')),
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

// Same shape as createAppointmentSchema minus the coupon (doesn't apply to
// a manually-registered appointment) plus an optional internal note.
export const createManualAppointmentSchema = z.object({
  name: clientNameSchema,

  whatsapp: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(
      z.string().regex(/^(55)?\d{11}$/, 'WhatsApp inválido. Informe o DDD + 9 dígitos.')
    ),

  email: z
    .string()
    .email('E-mail inválido.')
    .optional()
    .or(z.literal('')),

  serviceId: z
    .string()
    .uuid('Serviço inválido.'),

  slotId: z
    .string()
    .uuid('Horário inválido.'),

  complementIds: z
    .array(z.string().uuid())
    .max(10)
    .optional()
    .default([]),

  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('')),
})

export type CreateManualAppointmentInput = z.infer<typeof createManualAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

export const joinWaitlistSchema = z.object({
  name: clientNameSchema,

  whatsapp: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(
      z.string().regex(/^(55)?\d{11}$/, 'WhatsApp inválido. Informe o DDD + 9 dígitos.')
    ),

  serviceId: z
    .string()
    .uuid('Serviço inválido.'),

  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'),

  note: z
    .string()
    .max(300)
    .optional()
    .or(z.literal('')),
})

export const updateServiceSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  duration:    z.number().int().min(15).max(480),
  price:       z.number().min(0).max(9999),
  active:      z.boolean(),
  position:    z.number().int().min(0),
})

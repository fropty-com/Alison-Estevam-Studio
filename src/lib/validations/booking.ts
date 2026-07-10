import { z } from 'zod'

/**
 * Validation schemas — Zod schemas shared between client and server.
 * One source of truth for all form validation rules.
 */

export const createAppointmentSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome precisa ter pelo menos 2 caracteres.')
    .max(100, 'Nome muito longo.'),

  whatsapp: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .pipe(
      z.string().min(10, 'WhatsApp inválido.').max(13, 'WhatsApp inválido.')
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
})

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
})

export const updateServiceSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  duration:    z.number().int().min(15).max(480),
  price:       z.number().min(0).max(9999),
  active:      z.boolean(),
  position:    z.number().int().min(0),
})

import { BRAND } from '@/config/brand'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * WhatsApp message templates — all messages the system sends.
 * Consistent tone, consistent format, consistent brand voice.
 */

export function buildBookingConfirmationUrl(params: {
  clientName: string
  serviceName: string
  complementNames?: string[]
  totalPrice: number
  date: string        // ISO date: 2026-06-15
  startTime: string   // HH:mm
}): string {
  const formattedDate = format(parseISO(params.date), "d 'de' MMMM", { locale: ptBR })
  const complementos = params.complementNames && params.complementNames.length > 0
    ? params.complementNames.join(', ')
    : 'Nenhum'

  const message =
    `Olá, Alison. Gostaria de confirmar meu agendamento:\n\n` +
    `Serviço: ${params.serviceName}\n` +
    `Complementos: ${complementos}\n` +
    `Data: ${formattedDate}\n` +
    `Horário: ${params.startTime}\n` +
    `Valor total: ${formatCurrency(params.totalPrice)}`

  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`
}

/**
 * Horário Exclusivo doesn't use the calendar — it always redirects
 * straight to WhatsApp with this fixed message.
 */
export function buildExclusiveRequestUrl(): string {
  const message = 'Olá, Alison. Gostaria de solicitar um horário exclusivo.'
  return `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(message)}`
}

/**
 * Manual notify — opens WhatsApp with a chat to the CLIENT (not Alison),
 * prefilled so the barbeiro just has to hit send. There's no WhatsApp
 * Business API integration, so freeing up a slot never auto-notifies.
 */
export function buildWaitlistNotifyUrl(params: {
  clientName: string
  clientWhatsapp: string
  serviceName: string
  date: string
}): string {
  const formattedDate = format(parseISO(params.date), "EEEE, d 'de' MMMM", { locale: ptBR })
  const message =
    `Olá ${params.clientName}! Abriu um horário para ${params.serviceName} ` +
    `${formattedDate}. Quer aproveitar? É só responder aqui pra confirmar.`
  const digits = params.clientWhatsapp.replace(/\D/g, '')

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildReminderMessage(params: {
  clientName: string
  serviceName: string
  date: string
  startTime: string
  referenceCode: string
}): string {
  const formattedDate = format(parseISO(params.date), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    `Olá ${params.clientName}! 👋\n\n` +
    `Lembrando do seu agendamento amanhã:\n\n` +
    `✦ ${params.serviceName}\n` +
    `📅 ${formattedDate} às ${params.startTime}\n\n` +
    `Código: ${params.referenceCode}\n\n` +
    `Até amanhã! — Alison Estevam`
  )
}

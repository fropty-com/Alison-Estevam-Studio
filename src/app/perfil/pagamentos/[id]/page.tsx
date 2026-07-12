import { redirect, notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { formatCurrency } from '@/lib/utils'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ReceiptEmailButton } from '@/components/profile/ReceiptEmailButton'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Recibo — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  courtesy: 'Cortesia',
}

export default async function ReciboPage({ params }: { params: { id: string } }) {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any
  const { data: payment } = await db
    .from('payments')
    .select(`
      id, receipt_number, method, gross_amount, fee_amount, paid_at,
      appointments!inner(client_id, total_price, discount, services(name), time_slots(date, start_time), clients(name, whatsapp, email))
    `)
    .eq('id', params.id)
    .maybeSingle()

  const appt = payment ? (Array.isArray(payment.appointments) ? payment.appointments[0] : payment.appointments) : null
  if (!payment || !appt || appt.client_id !== session.clientId) notFound()

  const client  = Array.isArray(appt.clients)     ? appt.clients[0]     : appt.clients
  const service = Array.isArray(appt.services)    ? appt.services[0]   : appt.services
  const slot    = Array.isArray(appt.time_slots)  ? appt.time_slots[0] : appt.time_slots

  const discount = Number(appt.discount ?? 0)
  const fee      = Number(payment.fee_amount ?? 0)
  const subtotal = Number(appt.total_price) + discount
  const total    = Number(payment.gross_amount)

  const paidAtDate = parseISO(payment.paid_at)
  const serviceDateLabel = slot?.date
    ? format(parseISO(slot.date), "EEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Detalhes da Transação" backHref="/perfil/pagamentos" />

      <div className="max-w-[480px] mx-auto px-8 pt-[122px] pb-10">
        <div className="border border-offwhite/10 bg-offwhite/[0.02]">
          <div className="px-7 pt-7 pb-5 border-b border-offwhite/8">
            <p className="font-body font-light text-[8px] tracking-[0.32em] uppercase text-offwhite/25 mb-[10px]">
              ID {payment.id.slice(0, 8).toUpperCase()} · Recibo Nº {payment.receipt_number}
            </p>
            <p className="font-display font-light text-[19px] text-offwhite tracking-[0.01em]">{BRAND.fullName}</p>
            <p className="font-body font-light text-[11px] text-offwhite/35 mt-[4px]">
              {BRAND.address.street}, {BRAND.address.neighborhood} — {BRAND.address.city}/{BRAND.address.state}
            </p>
          </div>

          <div className="px-7 py-5 border-b border-offwhite/8 flex items-center justify-between">
            <div>
              <p className="font-body font-light text-[9px] tracking-[0.28em] uppercase text-sage-light mb-[3px]">Pago</p>
              <p className="font-body font-light text-[12px] text-offwhite/50">
                {format(paidAtDate, "d 'de' MMM. 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-body font-light text-[12px] text-offwhite/70">{client?.name}</p>
              <p className="font-body font-light text-[10px] text-offwhite/30 mt-[2px]">{client?.whatsapp}</p>
            </div>
          </div>

          <div className="px-7 py-5 border-b border-offwhite/8">
            <p className="font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/25 mb-[10px]">Item</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-body font-light text-[13px] text-offwhite/80">{service?.name ?? '—'}</p>
                <p className="font-body font-light text-[10px] text-offwhite/30 mt-[2px] capitalize">
                  {serviceDateLabel}{slot?.start_time ? ` às ${slot.start_time.slice(0, 5)}` : ''}
                </p>
              </div>
              <span className="font-data text-[14px] text-offwhite/70 shrink-0">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <div className="px-7 py-5 border-b border-offwhite/8 space-y-[6px]">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            <Row label="Desconto" value={`- ${formatCurrency(discount)}`} />
            {fee > 0 && <Row label="Taxa" value={formatCurrency(fee)} />}
            <div className="flex items-center justify-between pt-[10px] mt-[10px] border-t border-offwhite/10">
              <span className="font-body font-light text-[9px] tracking-[0.3em] uppercase text-offwhite/40">Total</span>
              <span className="font-data text-[22px] text-gold">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="px-7 py-5">
            <p className="font-body font-light text-[10.5px] text-offwhite/35">
              PAGO · {METHOD_LABEL[payment.method] ?? payment.method} · {format(paidAtDate, 'HH:mm')}, {format(paidAtDate, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <div className="mt-[24px]">
          <ReceiptEmailButton paymentId={payment.id} hasEmail={Boolean(client?.email)} />
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-body font-light text-[11.5px] text-offwhite/35">{label}</span>
      <span className="font-body font-light text-[11.5px] text-offwhite/55">{value}</span>
    </div>
  )
}

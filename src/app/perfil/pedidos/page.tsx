import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'

export const metadata: Metadata = { title: 'Meus Pedidos — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  preparando: 'Preparando',
  enviado: 'Enviado',
  pronto_retirada: 'Pronto para retirada',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  aguardando_pagamento: 'text-gold',
  pago: 'text-sage-light',
  preparando: 'text-sage-light',
  enviado: 'text-sage-light',
  pronto_retirada: 'text-sage-light',
  concluido: 'text-offwhite/50',
  cancelado: 'text-error/60',
}

export default async function PedidosPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()
  const { data: raw } = await db
    .from('orders')
    .select('id, reference_code, status, total, created_at, order_items(quantity, products(name))')
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })

  const orders = raw ?? []

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Meus Pedidos" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        {orders.length === 0 ? (
          <div className="border border-offwhite/[0.08] px-8 py-16 text-center">
            <p className="font-body font-light text-[13px] text-offwhite/40">
              Você ainda não fez nenhum pedido.
            </p>
            <Link href="/produtos" className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-gold hover:text-gold-light transition-colors mt-4 inline-block">
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="border border-offwhite/[0.07] divide-y divide-offwhite/6">
            {orders.map(o => {
              const items = o.order_items ?? []
              const itemsSummary = items
                .map(i => {
                  const product = Array.isArray(i.products) ? i.products[0] : i.products
                  return `${product?.name ?? 'Produto'} ×${i.quantity}`
                })
                .join(', ')
              return (
                <Link
                  key={o.id}
                  href={`/pedido/${o.reference_code}`}
                  className="flex items-center justify-between px-6 py-5 gap-4 hover:bg-offwhite/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-body font-light text-[12.5px] text-offwhite/75">
                      {format(parseISO(o.created_at), 'dd/MM/yyyy')} · #{o.reference_code}
                    </p>
                    <p className="font-body font-light text-[10px] text-offwhite/30 tracking-[0.06em] mt-[3px] truncate">
                      {itemsSummary || '—'}
                    </p>
                    <p className={`font-body font-medium text-[9px] tracking-[0.15em] uppercase mt-1 ${STATUS_COLOR[o.status] ?? 'text-offwhite/50'}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-data text-[14px] text-gold">{fmt(Number(o.total))}</span>
                    <span className="font-body font-light text-offwhite/25">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from '@/lib/orders'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Order {
  id: string
  referenceCode: string
  status: string
  total: number
  createdAt: string
  itemsSummary: string
}

export function OrdersListSection({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="border border-offwhite/[0.08] px-8 py-12 text-center">
        <p className="font-body font-light text-[13px] text-offwhite/55 mb-[10px]">
          Você ainda não fez nenhum pedido.
        </p>
        <Link href="/produtos" className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-gold hover:text-gold-light transition-colors inline-block">
          Ver produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="border border-offwhite/[0.07] divide-y divide-offwhite/6">
      {orders.map(o => (
        <Link
          key={o.id}
          href={`/pedido/${o.referenceCode}`}
          className="flex items-center justify-between px-5 py-4 gap-4 hover:bg-offwhite/5 transition-colors"
        >
          <div className="min-w-0">
            <p className="font-body font-light text-[12.5px] text-offwhite/75">
              {format(parseISO(o.createdAt), 'dd/MM/yyyy')} · #{o.referenceCode}
            </p>
            <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.06em] mt-[3px] truncate">
              {o.itemsSummary || '—'}
            </p>
            <p className={`font-body font-medium text-[9px] tracking-[0.15em] uppercase mt-1 ${ORDER_STATUS_COLOR[o.status] ?? 'text-offwhite/55'}`}>
              {ORDER_STATUS_LABEL[o.status] ?? o.status}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-data text-[14px] text-gold">{fmt(o.total)}</span>
            <span className="font-body font-light text-offwhite/55">→</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

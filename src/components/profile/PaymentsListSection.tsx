import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { BRAND } from '@/config/brand'
import { dateAnchorInSaoPaulo, formatTimeInSaoPaulo } from '@/lib/timezone'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  courtesy: 'Cortesia',
}

interface Payment {
  id: string
  method: string
  grossAmount: number
  paidAt: string
}

export function PaymentsListSection({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <div className="border border-offwhite/[0.08] px-8 py-12 text-center">
        <p className="font-body font-light text-[13px] text-offwhite/55">
          Você ainda não possui pagamentos registrados.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-offwhite/[0.07] divide-y divide-offwhite/6">
      {payments.map(p => (
        <Link
          key={p.id}
          href={`/perfil/pagamentos/${p.id}`}
          className="flex items-center justify-between px-5 py-4 hover:bg-offwhite/5 transition-colors"
        >
          <div>
            <p className="font-body font-light text-[12.5px] text-offwhite/75">
              {format(dateAnchorInSaoPaulo(parseISO(p.paidAt)), 'dd/MM/yyyy')} {formatTimeInSaoPaulo(parseISO(p.paidAt))}
            </p>
            <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.06em] mt-[3px]">
              {METHOD_LABEL[p.method] ?? p.method} · {BRAND.fullName}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-data text-[14px] text-gold">{formatCurrency(p.grossAmount)}</span>
            <span className="font-body font-light text-offwhite/55">→</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

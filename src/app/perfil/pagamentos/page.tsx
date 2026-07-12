import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { formatCurrency } from '@/lib/utils'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Pagamentos — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  courtesy: 'Cortesia',
}

export default async function PagamentosPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any
  const { data: raw } = await db
    .from('payments')
    .select('id, method, gross_amount, paid_at, appointments!inner(client_id)')
    .eq('appointments.client_id', session.clientId)
    .order('paid_at', { ascending: false })

  const payments = (raw ?? []) as any[]

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Pagamentos" />

      <div className="max-w-[560px] mx-auto px-8 py-10">
        {payments.length === 0 ? (
          <div className="border border-offwhite/8 px-8 py-16 text-center">
            <p className="font-body font-light text-[13px] text-offwhite/40">
              Você ainda não possui pagamentos registrados.
            </p>
          </div>
        ) : (
          <div className="border border-offwhite/7 divide-y divide-offwhite/6">
            {payments.map(p => (
              <Link
                key={p.id}
                href={`/perfil/pagamentos/${p.id}`}
                className="flex items-center justify-between px-6 py-5 hover:bg-offwhite/3 transition-colors"
              >
                <div>
                  <p className="font-body font-light text-[12.5px] text-offwhite/75">
                    {format(parseISO(p.paid_at), "dd/MM/yyyy HH:mm")}
                  </p>
                  <p className="font-body font-light text-[10px] text-offwhite/30 tracking-[0.06em] mt-[3px]">
                    {METHOD_LABEL[p.method] ?? p.method} · {BRAND.fullName}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-data text-[14px] text-gold">{formatCurrency(Number(p.gross_amount))}</span>
                  <span className="font-body font-light text-offwhite/25">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

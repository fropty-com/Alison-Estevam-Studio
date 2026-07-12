import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AvailabilityRuleRow } from '@/components/admin/AvailabilityRuleRow'
import { BlockedPeriodForm } from '@/components/admin/BlockedPeriodForm'
import { PaymentFeeSettingRow } from '@/components/admin/PaymentFeeSettingRow'
import { StaffMemberRow } from '@/components/admin/StaffMemberRow'
import { AddStaffMemberForm } from '@/components/admin/AddStaffMemberForm'
import { LoyaltySettingsForm } from '@/components/admin/LoyaltySettingsForm'
import { CouponRow } from '@/components/admin/CouponRow'
import { AddCouponForm } from '@/components/admin/AddCouponForm'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { removeBlockedPeriod } from '@/app/admin/actions'
import { getAdminRole, getAdminUser } from '@/lib/admin-auth'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const METHOD_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  courtesy: 'Cortesia',
}

const METHOD_ORDER = ['cash', 'pix', 'debit_card', 'credit_card', 'courtesy']

export default async function ConfiguracoesPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const currentUser = await getAdminUser()
  const db = await createServiceClient() as any

  const [rulesRes, blockedRes, feesRes, staffRes, loyaltyRes, couponsRes] = await Promise.all([
    db.from('availability_rules').select('*').order('weekday', { ascending: true }),
    db.from('blocked_periods').select('*').order('date_start', { ascending: true }),
    db.from('payment_fee_settings').select('*'),
    db.from('staff_members').select('*').order('created_at', { ascending: true }),
    db.from('loyalty_settings').select('*').eq('active', true).limit(1).maybeSingle(),
    db.from('coupons').select('*').order('created_at', { ascending: false }),
  ])

  const rules   = (rulesRes.data   ?? []) as any[]
  const blocked = (blockedRes.data ?? []) as any[]
  const staff   = (staffRes.data   ?? []) as any[]
  const loyalty = loyaltyRes.data as { visits_required: number; reward_description: string } | null
  const coupons = (couponsRes.data ?? []) as any[]
  const fees    = ((feesRes.data   ?? []) as any[])
    .sort((a, b) => METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method))

  return (
    <div className="p-8 space-y-10">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Configurações</h1>
      </div>

      {/* Working hours */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Horários de funcionamento
        </h2>
        <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
          {rules.map((r: any) => (
            <AvailabilityRuleRow
              key={r.id}
              rule={r}
              weekdayLabel={WEEKDAY[r.weekday] ?? `Dia ${r.weekday}`}
            />
          ))}
          {rules.length === 0 && (
            <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic">
              Nenhuma regra cadastrada. Adicione no banco de dados.
            </p>
          )}
        </div>
      </section>

      {/* Blocked periods */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Períodos bloqueados
        </h2>

        {/* Existing */}
        {blocked.length > 0 && (
          <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6 mb-4">
            {blocked.map((b: any) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-body font-light text-[12px] text-offwhite/75">
                    {format(parseISO(b.date_start), "d 'de' MMMM", { locale: ptBR })}
                    {b.date_start !== b.date_end && (
                      <> → {format(parseISO(b.date_end), "d 'de' MMMM", { locale: ptBR })}</>
                    )}
                  </p>
                  {b.reason && (
                    <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.12em] mt-[2px]">{b.reason}</p>
                  )}
                </div>
                <form action={async () => { 'use server'; await removeBlockedPeriod(b.id) }}>
                  <button
                    type="submit"
                    className="font-body font-light text-[8px] tracking-[0.22em] uppercase text-error/45 hover:text-error/70 transition-colors px-2 py-1 border border-transparent hover:border-error/20"
                  >
                    Remover
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <BlockedPeriodForm />
      </section>

      {/* Payment fees */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Taxas de pagamento
        </h2>
        <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
          {fees.map((f: any) => (
            <PaymentFeeSettingRow
              key={f.id}
              setting={f}
              label={METHOD_LABEL[f.method] ?? f.method}
            />
          ))}
          {fees.length === 0 && (
            <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic">
              Nenhuma taxa cadastrada.
            </p>
          )}
        </div>
      </section>

      {/* Loyalty program */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Programa de fidelidade
        </h2>
        {loyalty ? (
          <LoyaltySettingsForm settings={loyalty} />
        ) : (
          <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic bg-offwhite/3 border border-offwhite/7">
            Configuração não encontrada.
          </p>
        )}
      </section>

      {/* Coupons */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Cupons de desconto
        </h2>
        <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6 mb-4">
          {coupons.map((c: any) => (
            <CouponRow key={c.id} coupon={c} />
          ))}
          {coupons.length === 0 && (
            <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic">
              Nenhum cupom criado.
            </p>
          )}
        </div>
        <AddCouponForm />
      </section>

      {/* Team / roles */}
      <section>
        <h2 className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/40 mb-4">
          Equipe
        </h2>
        <p className="font-body font-light text-[11px] text-offwhite/35 leading-[1.6] mb-4 max-w-[520px]">
          Donos veem tudo, incluindo Relatórios e esta página. Funcionários veem agenda, clientes e
          serviços, sem acesso ao financeiro.
        </p>
        <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6 mb-4">
          {staff.map((s: any) => (
            <StaffMemberRow
              key={s.id}
              member={s}
              isSelf={s.id === currentUser?.id}
            />
          ))}
          {staff.length === 0 && (
            <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic">
              Nenhum membro cadastrado.
            </p>
          )}
        </div>
        <AddStaffMemberForm />
      </section>
    </div>
  )
}

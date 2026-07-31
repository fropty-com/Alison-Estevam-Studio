import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
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

function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" /><path d="M7.5 4v3.7l2.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><rect x="3" y="6.5" width="9" height="6.5" rx="0.5" stroke="currentColor" strokeWidth="1.1" /><path d="M4.5 6.5V4.8a3 3 0 0 1 6 0V6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
}
function CurrencyIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" /><path d="M9.3 5.3c-.4-.5-1.1-.8-1.8-.8-1.2 0-2.1.8-2.1 1.8s.9 1.5 2.1 1.8c1.2.3 2.1.8 2.1 1.8s-.9 1.8-2.1 1.8c-.7 0-1.4-.3-1.8-.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><line x1="7.5" y1="3" x2="7.5" y2="4.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><line x1="7.5" y1="10.7" x2="7.5" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
}
function StarIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M7.5 1.5 9.2 5.4l4.3.4-3.3 2.9 1 4.2-3.7-2.3-3.7 2.3 1-4.2-3.3-2.9 4.3-.4Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /></svg>
}
function TagIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M2 2h5.5L13 7.5 7.5 13 2 7.5V2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><circle cx="4.7" cy="4.7" r="0.9" fill="currentColor" /></svg>
}
function TeamIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="5.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.1" /><path d="M1.5 13c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><circle cx="11" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1" /><path d="M10 8.7c1.7.1 2.9 1.3 3 3.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
}
function ScissorsIcon() {
  return <svg width="16" height="16" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="4.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.1" /><circle cx="4.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.1" /><line x1="12.5" y1="4.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><line x1="6" y1="4.5" x2="12.5" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
}
function ArrowIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 9 9 3M9 3H4M9 3v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
}

const QUICK_LINKS = [
  { href: '#horarios',  Icon: ClockIcon,    label: 'Horários',   desc: 'Funcionamento por dia da semana' },
  { href: '#bloqueios', Icon: LockIcon,     label: 'Bloqueios',  desc: 'Folgas e períodos fechados' },
  { href: '#taxas',     Icon: CurrencyIcon, label: 'Taxas',      desc: 'Custo por forma de pagamento' },
  { href: '#fidelidade',Icon: StarIcon,     label: 'Fidelidade', desc: 'Recompensa por visitas' },
  { href: '#cupons',    Icon: TagIcon,      label: 'Cupons',     desc: 'Descontos promocionais' },
  { href: '#equipe',    Icon: TeamIcon,     label: 'Equipe',     desc: 'Quem tem acesso ao painel' },
  { href: '/admin/servicos', Icon: ScissorsIcon, label: 'Serviços', desc: 'Adicionar, editar e remover' },
]

function SectionCard({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-[32px] h-[32px] rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
          {icon}
        </span>
        <h2 className="font-body font-light text-[10px] tracking-[0.3em] uppercase text-offwhite/60">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

export default async function ConfiguracoesPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const currentUser = await getAdminUser()
  const db = await createServiceClient()

  const [rulesRes, blockedRes, feesRes, staffRes, loyaltyRes, couponsRes] = await Promise.all([
    db.from('availability_rules').select('*').order('weekday', { ascending: true }),
    db.from('blocked_periods').select('*').order('date_start', { ascending: true }),
    db.from('payment_fee_settings').select('*'),
    db.from('staff_members').select('*').order('created_at', { ascending: true }),
    db.from('loyalty_settings').select('*').eq('active', true).limit(1).maybeSingle(),
    db.from('coupons').select('*').order('created_at', { ascending: false }),
  ])

  const rules   = rulesRes.data   ?? []
  const blocked = blockedRes.data ?? []
  const staff   = staffRes.data   ?? []
  const loyalty = loyaltyRes.data as { visits_required: number; reward_description: string } | null
  const coupons = couponsRes.data ?? []
  const fees    = (feesRes.data   ?? [])
    .sort((a, b) => METHOD_ORDER.indexOf(a.method) - METHOD_ORDER.indexOf(b.method))

  return (
    <div className="px-6 py-8 space-y-10">
      <div>
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Configurações</h1>
        <p className="font-body font-light text-[11px] text-offwhite/35 tracking-[0.05em] mt-2 max-w-[560px]">
          Personalize o que for necessário para o dia a dia do seu trabalho — horários, preços, equipe e muito mais.
        </p>
      </div>

      {/* Acesso rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ href, Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-offwhite/5 border border-offwhite/[0.07] p-4 flex items-start gap-3 hover:border-gold/30 hover:bg-gold/5 transition-all duration-200 group"
          >
            <span className="w-[32px] h-[32px] rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
              <Icon />
            </span>
            <div className="min-w-0">
              <p className="font-body font-light text-[11px] text-offwhite/80 flex items-center gap-1">
                {label}
                <span className="text-offwhite/20 group-hover:text-gold/60 transition-colors"><ArrowIcon /></span>
              </p>
              <p className="font-body font-light text-[8.5px] text-offwhite/30 mt-[2px] leading-[1.4]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Working hours */}
      <SectionCard id="horarios" icon={<ClockIcon />} title="Horários de funcionamento">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
          {rules.map(r => (
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
      </SectionCard>

      {/* Blocked periods */}
      <SectionCard id="bloqueios" icon={<LockIcon />} title="Períodos bloqueados">
        {blocked.length > 0 && (
          <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6 mb-4">
            {blocked.map(b => (
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
        <BlockedPeriodForm />
      </SectionCard>

      {/* Payment fees */}
      <SectionCard id="taxas" icon={<CurrencyIcon />} title="Taxas de pagamento">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
          {fees.map(f => (
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
      </SectionCard>

      {/* Loyalty program */}
      <SectionCard id="fidelidade" icon={<StarIcon />} title="Programa de fidelidade">
        {loyalty ? (
          <LoyaltySettingsForm settings={loyalty} />
        ) : (
          <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic bg-offwhite/5 border border-offwhite/[0.07]">
            Configuração não encontrada.
          </p>
        )}
      </SectionCard>

      {/* Coupons */}
      <SectionCard id="cupons" icon={<TagIcon />} title="Cupons de desconto">
        <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6 mb-4">
          {coupons.map(c => (
            <CouponRow key={c.id} coupon={{ ...c, discount_type: c.discount_type as 'percentage' | 'fixed' }} />
          ))}
          {coupons.length === 0 && (
            <p className="px-5 py-6 font-body font-light text-[11px] text-offwhite/25 italic">
              Nenhum cupom criado.
            </p>
          )}
        </div>
        <AddCouponForm />
      </SectionCard>

      {/* Team / roles */}
      <SectionCard id="equipe" icon={<TeamIcon />} title="Equipe">
        <p className="font-body font-light text-[11px] text-offwhite/35 leading-[1.6] mb-4 max-w-[520px]">
          Donos veem tudo, incluindo Financeiro e esta página. Funcionários veem agenda, clientes e
          serviços, sem acesso ao financeiro.
        </p>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6 mb-4">
          {staff.map(s => (
            <StaffMemberRow
              key={s.id}
              member={{ ...s, role: s.role as 'owner' | 'staff' }}
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
      </SectionCard>
    </div>
  )
}

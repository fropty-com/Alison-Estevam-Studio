import { createServiceClient } from '@/lib/supabase/server'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AvailabilityRuleRow } from '@/components/admin/AvailabilityRuleRow'
import { BlockedPeriodForm } from '@/components/admin/BlockedPeriodForm'
import { removeBlockedPeriod } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default async function ConfiguracoesPage() {
  const db = await createServiceClient() as any

  const [rulesRes, blockedRes] = await Promise.all([
    db.from('availability_rules').select('*').order('weekday', { ascending: true }),
    db.from('blocked_periods').select('*').order('date_start', { ascending: true }),
  ])

  const rules   = (rulesRes.data   ?? []) as any[]
  const blocked = (blockedRes.data ?? []) as any[]

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
    </div>
  )
}

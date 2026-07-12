import { createServiceClient } from '@/lib/supabase/server'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const CATEGORY_DOT: Record<string, string> = {
  appointment: 'bg-sage/70',
  service: 'bg-gold/80',
  payment_fee: 'bg-gold/80',
  staff: 'bg-error/50',
  blocked_period: 'bg-offwhite/40',
  availability_rule: 'bg-offwhite/40',
  loyalty: 'bg-sage/70',
  coupon: 'bg-sage/70',
}

function dayLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Hoje'
  if (isYesterday(d)) return 'Ontem'
  return format(d, "d 'de' MMMM", { locale: ptBR })
}

export default async function AuditoriaPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const db = await createServiceClient() as any

  const { data: raw } = await db
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const entries = (raw ?? []) as any[]

  // Group by day for readability
  const groups: { day: string; items: any[] }[] = []
  for (const entry of entries) {
    const day = format(parseISO(entry.created_at), 'yyyy-MM-dd')
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(entry)
    else groups.push({ day, items: [entry] })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Auditoria</h1>
        <p className="font-body font-light text-[10px] text-offwhite/28 tracking-[0.1em] mt-1">
          Últimas {entries.length} ações registradas no painel.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-offwhite/3 border border-offwhite/7 p-10 text-center">
          <p className="font-display font-light text-[20px] text-offwhite/18 italic">
            Nenhuma ação registrada ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ day, items }) => (
            <div key={day}>
              <p className="font-body font-light text-[8px] tracking-[0.32em] uppercase text-offwhite/30 mb-3">
                {dayLabel(day)}
              </p>
              <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
                {items.map((entry: any) => {
                  const category = entry.action.split('.')[0]
                  return (
                    <div key={entry.id} className="flex items-start gap-3 px-5 py-4">
                      <span className={cn('w-[7px] h-[7px] rounded-full shrink-0 mt-[5px]', CATEGORY_DOT[category] ?? 'bg-offwhite/30')} />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-light text-[12.5px] text-offwhite/80">
                          {entry.summary}
                        </p>
                        <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.1em] mt-[3px]">
                          {entry.actor_name} · {format(parseISO(entry.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

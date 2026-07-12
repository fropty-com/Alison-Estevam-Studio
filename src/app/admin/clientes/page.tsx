import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const db = await createServiceClient() as any

  const { data: clients } = await db
    .from('clients')
    .select('id, name, whatsapp, email, vip, created_at, notes')
    .order('name', { ascending: true })

  const list = (clients ?? []) as any[]

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">
          Clientes <span className="text-offwhite/25 text-[22px]">{list.length}</span>
        </h1>
      </div>

      {list.length === 0 ? (
        <div className="bg-offwhite/3 border border-offwhite/7 p-10 text-center">
          <p className="font-display font-light text-[20px] text-offwhite/18 italic">Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
          {list.map((c: any) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-offwhite/4 transition-colors duration-150 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-[2px]">
                  <p className="font-body font-light text-[13px] text-offwhite group-hover:text-offwhite truncate">
                    {c.name}
                  </p>
                  {c.vip && (
                    <span className="font-body font-light text-[7px] tracking-[0.3em] uppercase px-[7px] py-[2px] bg-gold/10 border border-gold/25 text-gold/60 shrink-0">
                      VIP
                    </span>
                  )}
                </div>
                <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.12em]">
                  {c.whatsapp}{c.email ? ` · ${c.email}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body font-light text-[8.5px] text-offwhite/22 tracking-[0.12em]">
                  desde {format(new Date(c.created_at), "MMM yyyy", { locale: ptBR })}
                </p>
              </div>
              <span className="text-offwhite/18 group-hover:text-offwhite/45 transition-colors text-[12px]">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

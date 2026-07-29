import { createServiceClient } from '@/lib/supabase/server'
import { ClientListFilter, type ClientListItem } from '@/components/admin/ClientListFilter'

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const db = await createServiceClient() as any

  const { data: clients } = await db
    .from('clients')
    .select('id, name, whatsapp, email, vip, created_at, notes')
    .order('name', { ascending: true })

  const list = (clients ?? []) as ClientListItem[]

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">
          Clientes <span className="text-offwhite/25 text-[22px]">{list.length}</span>
        </h1>
      </div>

      <ClientListFilter clients={list} />
    </div>
  )
}

import { createServiceClient } from '@/lib/supabase/server'
import { ServiceRow } from '@/components/admin/ServiceRow'

export const dynamic = 'force-dynamic'

export default async function ServicosPage() {
  const db = await createServiceClient() as any
  const { data } = await db
    .from('services')
    .select('id, name, slug, description, duration, price, active, position')
    .order('position', { ascending: true })

  const services = (data ?? []) as any[]

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Serviços</h1>
      </div>

      <div className="bg-offwhite/3 border border-offwhite/7 divide-y divide-offwhite/6">
        {services.map((s: any) => (
          <ServiceRow key={s.id} service={s} />
        ))}
      </div>
    </div>
  )
}

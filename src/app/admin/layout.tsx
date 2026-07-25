import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { getAdminUser } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: { default: 'Admin · Alison Estevam', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()

  const db = await createServiceClient() as any
  const [{ data: staff }, { data: pending }] = await Promise.all([
    user
      ? db.from('staff_members').select('name, role').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    db
      .from('appointments')
      .select('id, reference_code, clients(name), services(name), time_slots(date, start_time)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const isOwner = staff?.role === 'owner'

  const pendingList = (pending ?? []).map((a: any) => {
    const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
    return {
      id: a.id,
      referenceCode: a.reference_code as string,
      clientName: (Array.isArray(a.clients) ? a.clients[0] : a.clients)?.name ?? 'Cliente',
      serviceName: (Array.isArray(a.services) ? a.services[0] : a.services)?.name ?? 'Serviço',
      date: slot?.date as string | undefined,
      startTime: slot?.start_time ? (slot.start_time as string).substring(0, 5) : undefined,
    }
  })

  return (
    <div className="min-h-screen bg-charcoal text-offwhite flex">
      <AdminNav isOwner={isOwner} />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopBar
          staffName={staff?.name ?? user?.email ?? 'Equipe'}
          isOwner={isOwner}
          pending={pendingList}
        />
        <main className="flex-1 min-w-0 pt-8 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminTopBar } from '@/components/admin/AdminTopBar'
import { getAdminUser } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/getLocale'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'

export const metadata: Metadata = {
  title: { default: 'Admin · Alison Estevam', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()

  // Only /admin/login ever reaches this layout without a session (middleware
  // redirects every other /admin/* route to it otherwise) — so an absent
  // user always means "showing the login screen," which gets none of the
  // authenticated chrome (sidebar, topbar, search, notifications).
  if (!user) return <>{children}</>

  const locale = await getLocale()

  const db = await createServiceClient()
  const [{ data: staff }, { data: pending }] = await Promise.all([
    user
      ? db.from('staff_members').select('name, role, avatar_url').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    db
      .from('appointments')
      .select('id, reference_code, clients(name), services(name), time_slots(date, start_time)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const isOwner = staff?.role === 'owner'

  const pendingList = (pending ?? []).map(a => {
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
    <LanguageProvider initialLocale={locale}>
      <div className="min-h-screen bg-charcoal text-offwhite flex">
        <AdminNav isOwner={isOwner} />
        <div className="flex-1 min-w-0 flex flex-col">
          <AdminTopBar
            staffName={staff?.name ?? user?.email ?? 'Equipe'}
            staffAvatarUrl={staff?.avatar_url ?? null}
            isOwner={isOwner}
            pending={pendingList}
          />
          <main className="flex-1 min-w-0 pt-8 lg:pt-0">
            {children}
          </main>
        </div>
      </div>
    </LanguageProvider>
  )
}

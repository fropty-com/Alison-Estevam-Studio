import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'
import { getAdminRole } from '@/lib/admin-auth'

export const metadata: Metadata = {
  title: { default: 'Admin · Alison Estevam', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getAdminRole()

  return (
    <div className="min-h-screen bg-charcoal text-offwhite flex">
      <AdminNav isOwner={role === 'owner'} />
      <main className="flex-1 min-w-0 pt-8 lg:pt-0">
        {children}
      </main>
    </div>
  )
}

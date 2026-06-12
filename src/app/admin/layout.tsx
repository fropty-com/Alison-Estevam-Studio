import type { Metadata } from 'next'
import { AdminNav } from '@/components/admin/AdminNav'

export const metadata: Metadata = {
  title: { default: 'Admin · Alison Estevam', template: '%s · Admin' },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-charcoal text-offwhite flex">
      <AdminNav />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { EntrarFlow } from '@/components/auth/EntrarFlow'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export const metadata: Metadata = {
  title: 'Entrar — Alison Estevam Studio',
}
export const dynamic = 'force-dynamic'

export default async function EntrarPage() {
  const session = await getVerifiedClientSession()
  if (session) redirect('/conta')

  return (
    <div className="max-w-[480px] mx-auto min-h-screen">
      <div className="border-b border-offwhite/6 px-8 py-6 flex items-center justify-between">
        <Link href="/" className="font-display font-light text-base tracking-[0.06em] uppercase text-offwhite/70 hover:text-offwhite transition-colors">
          Alison Estevam
        </Link>
        <ThemeToggle />
      </div>
      <EntrarFlow />
    </div>
  )
}

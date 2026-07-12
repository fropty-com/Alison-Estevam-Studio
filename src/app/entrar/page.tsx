import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { EntrarFlow } from '@/components/auth/EntrarFlow'
import { getVerifiedClientSession } from '@/lib/client-auth/session'

export const metadata: Metadata = {
  title: 'Entrar — Alison Estevam Studio',
}
export const dynamic = 'force-dynamic'

export default async function EntrarPage() {
  const session = await getVerifiedClientSession()
  if (session) redirect('/conta')

  return (
    <div className="max-w-[480px] mx-auto min-h-screen">
      <EntrarFlow />
    </div>
  )
}

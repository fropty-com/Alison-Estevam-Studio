import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AgendarFlow } from '@/components/booking/AgendarFlow'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'

export const metadata: Metadata = {
  title: 'Agendamento — Alison Estevam Studio',
}

export const dynamic = 'force-dynamic'

export default async function AgendarPage() {
  const session = await getVerifiedClientSession()
  let initialClient: { name: string; whatsapp: string; email: string } | null = null

  if (session) {
    const db = await createServiceClient() as any
    const { data: client } = await db
      .from('clients')
      .select('name, whatsapp, email')
      .eq('id', session.clientId)
      .single()

    if (client) {
      initialClient = { name: client.name, whatsapp: client.whatsapp, email: client.email ?? '' }
    }
  }

  return (
    <div className="max-w-[480px] mx-auto min-h-screen">
      <Suspense fallback={null}>
        <AgendarFlow initialClient={initialClient} />
      </Suspense>
    </div>
  )
}

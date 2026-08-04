import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton'
import { WhatsappConsentToggle } from '@/components/profile/WhatsappConsentToggle'
import { ReminderEmailToggle } from '@/components/profile/ReminderEmailToggle'

export const metadata: Metadata = { title: 'Detalhes da conta — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function ContaDetalhesPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()
  const { data: client } = await db
    .from('clients')
    .select('consent_whatsapp, receive_reminder_emails, created_at')
    .eq('id', session.clientId)
    .single()

  if (!client) redirect('/entrar')

  const memberSince = format(parseISO(client.created_at), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Detalhes da conta" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <p className="font-body font-light text-[10px] text-offwhite/25 tracking-[0.08em] mb-[26px]">
          Nome, telefone, e-mail e foto ficam em{' '}
          <a href="/perfil" className="text-offwhite/45 hover:text-offwhite/70 underline underline-offset-2 transition-colors">Meu perfil</a>.
        </p>

        <WhatsappConsentToggle initialConsent={client.consent_whatsapp} />
        <ReminderEmailToggle initialConsent={client.receive_reminder_emails} />

        <p className="font-body font-light text-[10px] text-offwhite/25 tracking-[0.08em] mb-[36px]">
          Cliente desde {memberSince}.
        </p>

        <div className="pt-[26px] border-t border-offwhite/[0.08]">
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}

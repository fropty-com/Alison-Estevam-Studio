import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { AccountForm } from '@/components/profile/AccountForm'
import { DeleteAccountButton } from '@/components/profile/DeleteAccountButton'
import { WhatsappConsentToggle } from '@/components/profile/WhatsappConsentToggle'

export const metadata: Metadata = { title: 'Detalhes da conta — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

export default async function ContaDetalhesPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any
  const { data: client } = await db
    .from('clients')
    .select('name, whatsapp, email, consent_whatsapp, created_at')
    .eq('id', session.clientId)
    .single()

  if (!client) redirect('/entrar')

  const memberSince = format(parseISO(client.created_at), "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Detalhes da conta" />

      <div className="max-w-[560px] mx-auto px-8 pt-[122px] pb-10">
        <AccountForm initialName={client.name} initialEmail={client.email ?? ''} />

        <div className="mb-[26px] pt-[6px]">
          <p className="font-body font-light text-xs tracking-[0.28em] uppercase text-offwhite/40 mb-[6px]">Telefone</p>
          <p className="font-data text-[14px] text-offwhite/60">{client.whatsapp}</p>
          <p className="font-body font-light text-[10px] text-offwhite/25 mt-[4px]">
            Vinculado ao seu login — para trocar, fale com a gente pelo WhatsApp.
          </p>
        </div>

        <WhatsappConsentToggle initialConsent={client.consent_whatsapp} />

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

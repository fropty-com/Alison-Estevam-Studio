import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { MenuRow } from '@/components/profile/MenuRow'
import { ProfileHeader } from '@/components/profile/ProfileHeader'

export const metadata: Metadata = { title: 'Perfil — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase()
}

export default async function PerfilPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient() as any
  const { data: client } = await db
    .from('clients')
    .select('name, whatsapp, avatar_url')
    .eq('id', session.clientId)
    .single()

  if (!client) redirect('/entrar')

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Perfil" backHref="/conta" />

      <div className="max-w-[560px] mx-auto px-8 pt-[122px] pb-10">
        {/* Header: avatar, name, phone */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-[64px] h-[64px] rounded-full bg-offwhite/6 border border-offwhite/10 flex items-center justify-center shrink-0 overflow-hidden">
            {client.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display font-light text-[22px] text-gold/70">{initials(client.name)}</span>
            )}
          </div>
          <div>
            <p className="font-display font-light text-[21px] text-offwhite tracking-[0.01em]">{client.name}</p>
            <p className="font-body font-light text-[12px] text-offwhite/35 mt-[2px]">{client.whatsapp}</p>
          </div>
        </div>

        {/* Menu */}
        <div className="border border-offwhite/7 divide-y divide-offwhite/6">
          <MenuRow href="/perfil/fidelidade" icon="◆" label="Cartão Fidelidade" />
          <MenuRow href="/perfil/conta" icon="◻" label="Detalhes da conta" />
          <MenuRow href="/perfil/avaliacoes" icon="★" label="Avaliações" />
          <MenuRow href="/perfil/pagamentos" icon="▤" label="Pagamentos" />
          <MenuRow href="/perfil/sobre" icon="○" label="Sobre" />
        </div>
      </div>
    </div>
  )
}

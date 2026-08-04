import { redirect } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { MenuRow } from '@/components/profile/MenuRow'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { EditClientProfileForm } from '@/components/profile/EditClientProfileForm'
import { maskPhoneInput } from '@/lib/utils'

export const metadata: Metadata = { title: 'Perfil — Alison Estevam Studio' }
export const dynamic = 'force-dynamic'

const h2Cls = 'font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/45 mb-4'
const labelCls = 'font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/[0.28] mb-[3px]'
const valueCls = 'font-body font-light text-[13px] text-offwhite/75'

export default async function PerfilPage() {
  const session = await getVerifiedClientSession()
  if (!session) redirect('/entrar')

  const db = await createServiceClient()
  const { data: client } = await db
    .from('clients')
    .select('name, whatsapp, email, avatar_url, created_at')
    .eq('id', session.clientId)
    .single()

  if (!client) redirect('/entrar')

  const initialPhone = client.whatsapp ? maskPhoneInput(client.whatsapp.replace(/^\+?55/, '')) : ''
  const memberSince = client.created_at
    ? format(parseISO(client.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Perfil" backHref="/conta" />

      <div className="max-w-[560px] mx-auto px-8 pt-[65px] pb-10">
        <div className="mb-8">
          <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Cliente</p>
          <h1 className="font-display font-light text-[26px] text-offwhite tracking-[0.03em]">Meu perfil</h1>
          <p className="font-body font-light text-[10px] text-offwhite/[0.28] tracking-[0.1em] mt-1">
            Seus dados de cadastro e informações da conta.
          </p>
        </div>

        <section className="mb-5">
          <h2 className={h2Cls}>Dados do perfil</h2>
          <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
            <EditClientProfileForm
              initialName={client.name}
              initialPhone={initialPhone}
              initialEmail={client.email ?? ''}
              initialAvatarUrl={client.avatar_url}
            />
          </div>
        </section>

        <section className="mb-8">
          <h2 className={h2Cls}>Dados da conta</h2>
          <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
            <div className="px-5 py-4">
              <p className={labelCls}>Cliente desde</p>
              <p className={valueCls}>{memberSince}</p>
            </div>
          </div>
        </section>

        <div className="border border-offwhite/[0.07] divide-y divide-offwhite/6">
          <MenuRow href="/perfil/fidelidade" icon="◆" label="Cartão Fidelidade" />
          <MenuRow href="/perfil/conta" icon="◻" label="Detalhes da conta" />
          <MenuRow href="/perfil/avaliacoes" icon="★" label="Avaliações" />
          <MenuRow href="/perfil/pagamentos" icon="▤" label="Pagamentos" />
          <MenuRow href="/perfil/pedidos" icon="▣" label="Meus Pedidos" />
          <MenuRow href="/perfil/sobre" icon="○" label="Sobre" />
        </div>
      </div>
    </div>
  )
}

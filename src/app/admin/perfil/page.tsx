import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getAdminUser } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { EditStaffProfileForm } from '@/components/admin/EditStaffProfileForm'
import { maskPhoneInput } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const h2Cls = 'font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/55 mb-4'
const labelCls = 'font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[3px]'
const valueCls = 'font-body font-light text-[13px] text-offwhite/75'

export default async function AdminPerfilPage() {
  const user = await getAdminUser()
  if (!user) return null

  const db = await createServiceClient()
  const { data: staff } = await db
    .from('staff_members')
    .select('name, phone, role, avatar_url, birth_date, created_at')
    .eq('id', user.id)
    .single()

  const initialPhone = staff?.phone ? maskPhoneInput(staff.phone.replace(/^\+?55/, '')) : ''
  const memberSince = staff?.created_at
    ? format(new Date(staff.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '—'

  return (
    <div className="px-6 pt-3 pb-8 max-w-[640px] mx-auto">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/55 mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Meu perfil</h1>
        <p className="font-body font-light text-[10px] text-offwhite/55 tracking-[0.1em] mt-1">
          Seus dados de cadastro e informações da conta.
        </p>
      </div>

      <section className="mb-5">
        <h2 className={h2Cls}>Dados do perfil</h2>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-5">
          <EditStaffProfileForm
            userId={user.id}
            initialName={staff?.name ?? ''}
            initialPhone={initialPhone}
            initialEmail={user.email ?? ''}
            initialBirthDate={staff?.birth_date ?? ''}
            initialAvatarUrl={staff?.avatar_url ?? null}
          />
        </div>
      </section>

      <section>
        <h2 className={h2Cls}>Dados da conta</h2>
        <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
          <div className="px-5 py-4">
            <p className={labelCls}>Papel</p>
            <p className={valueCls}>{staff?.role === 'owner' ? 'Proprietário' : 'Funcionário'}</p>
          </div>
          <div className="px-5 py-4">
            <p className={labelCls}>Membro desde</p>
            <p className={valueCls}>{memberSince}</p>
          </div>
        </div>
      </section>
    </div>
  )
}

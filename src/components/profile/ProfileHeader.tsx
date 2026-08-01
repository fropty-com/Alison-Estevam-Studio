import { ClientHeader } from '@/components/layout/ClientHeader'
import { ClientAccountMenu } from '@/components/profile/ClientAccountMenu'
import { ClientSearchBox } from '@/components/profile/ClientSearchBox'
import { getVerifiedClientSession } from '@/lib/client-auth/session'
import { createServiceClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/getLocale'
import { LanguageProvider } from '@/lib/i18n/LanguageProvider'

const UPCOMING_STATUSES = ['pending', 'confirmed', 'checked_in', 'in_progress']

export async function ProfileHeader({ title, backHref = '/perfil' }: { title: string; backHref?: string }) {
  const session = await getVerifiedClientSession()
  if (!session) return <ClientHeader backHref={backHref} title={title} />

  const db = await createServiceClient()
  const [{ data: client }, { data: apptsRaw }, locale] = await Promise.all([
    db.from('clients').select('name, avatar_url').eq('id', session.clientId).maybeSingle(),
    db
      .from('appointments')
      .select('id, status, services(name), time_slots(date, start_time)')
      .eq('client_id', session.clientId)
      .order('time_slots(date)', { ascending: true })
      .order('time_slots(start_time)', { ascending: true }),
    getLocale(),
  ])

  const upcoming = (apptsRaw ?? [])
    .filter(a => UPCOMING_STATUSES.includes(a.status))
    .slice(0, 5)
    .map(a => {
      const svc = Array.isArray(a.services) ? a.services[0] : a.services
      const slot = Array.isArray(a.time_slots) ? a.time_slots[0] : a.time_slots
      return {
        id: a.id,
        serviceName: svc?.name ?? '—',
        date: slot?.date as string | undefined,
        startTime: slot?.start_time ? (slot.start_time as string).substring(0, 5) : undefined,
      }
    })

  return (
    <LanguageProvider initialLocale={locale}>
      <ClientHeader
        backHref={backHref}
        title={title}
        search={<ClientSearchBox />}
        right={
          <ClientAccountMenu
            name={client?.name ?? 'Cliente'}
            avatarUrl={client?.avatar_url ?? null}
            upcoming={upcoming}
          />
        }
      />
    </LanguageProvider>
  )
}

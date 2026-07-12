import { ClientHeader } from '@/components/layout/ClientHeader'

export function ProfileHeader({ title, backHref = '/perfil' }: { title: string; backHref?: string }) {
  return <ClientHeader backHref={backHref} title={title} />
}

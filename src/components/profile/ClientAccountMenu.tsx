'use client'

import { LanguageSelector } from '@/components/admin/LanguageSelector'
import { HelpMenu } from '@/components/admin/HelpMenu'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ClientNotificationsBell, type UpcomingItem } from './ClientNotificationsBell'
import { ClientProfileMenu } from './ClientProfileMenu'

/** Icon cluster for the client topbar — mirrors AdminTopBar's right-side
    order exactly (Language, Help, Theme, Notifications, Profile). Rendered
    inside the caller's own LanguageProvider, shared with ClientSearchBox
    so both slots of ClientHeader read from the same locale context. */
export function ClientAccountMenu({
  name,
  avatarUrl,
  upcoming,
}: {
  name: string
  avatarUrl: string | null
  upcoming: UpcomingItem[]
}) {
  return (
    <div className="flex items-center gap-3">
      <LanguageSelector />
      <HelpMenu />
      <ThemeToggle />
      <ClientNotificationsBell upcoming={upcoming} />
      <ClientProfileMenu name={name} avatarUrl={avatarUrl} />
    </div>
  )
}

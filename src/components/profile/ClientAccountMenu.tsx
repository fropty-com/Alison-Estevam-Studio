'use client'

import { LanguageProvider } from '@/lib/i18n/LanguageProvider'
import type { Locale } from '@/lib/i18n/locales'
import { LanguageSelector } from '@/components/admin/LanguageSelector'
import { HelpMenu } from '@/components/admin/HelpMenu'
import { ClientSearchBox } from './ClientSearchBox'
import { ClientNotificationsBell, type UpcomingItem } from './ClientNotificationsBell'
import { ClientProfileMenu } from './ClientProfileMenu'

export function ClientAccountMenu({
  locale,
  name,
  avatarUrl,
  upcoming,
}: {
  locale: Locale
  name: string
  avatarUrl: string | null
  upcoming: UpcomingItem[]
}) {
  return (
    <LanguageProvider initialLocale={locale}>
      <div className="flex items-center gap-3">
        <ClientSearchBox />
        <LanguageSelector />
        <HelpMenu />
        <ClientNotificationsBell upcoming={upcoming} />
        <ClientProfileMenu name={name} avatarUrl={avatarUrl} />
      </div>
    </LanguageProvider>
  )
}

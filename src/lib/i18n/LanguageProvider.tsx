'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, type Locale } from './locales'
import { getDictionary, type Dictionary } from './getDictionary'

const LanguageContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void } | null>(null)

export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const router = useRouter()

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    router.refresh()
  }

  return <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLocale must be used within a LanguageProvider')
  return ctx
}

/** Convenience hook for client components — `t` is the full dictionary for the current locale. */
export function useTranslation(): { t: Dictionary; locale: Locale } {
  const { locale } = useLocale()
  return { t: getDictionary(locale), locale }
}

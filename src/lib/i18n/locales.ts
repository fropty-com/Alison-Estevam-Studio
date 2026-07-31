export const LOCALES = ['pt', 'en', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'pt'

export const LOCALE_LABEL: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
}

export const LOCALE_COOKIE = 'admin_locale'

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

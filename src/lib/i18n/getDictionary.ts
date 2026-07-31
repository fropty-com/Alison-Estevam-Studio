import type { Locale } from './locales'
import pt from './dictionaries/pt'
import en from './dictionaries/en'
import es from './dictionaries/es'
import type { Dictionary } from './dictionaries/pt'

const DICTIONARIES: Record<Locale, Dictionary> = { pt, en, es }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale]
}

export type { Dictionary }

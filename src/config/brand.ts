/**
 * Brand configuration — single source of truth for all brand constants.
 * Never hardcode these values in components.
 */
export const BRAND = {
  name: 'Alison Estevam',
  fullName: 'Alison Estevam Studio',
  tagline: 'Barbearia · Atendimento Exclusivo',
  description: 'Atendimento exclusivo, um cliente por vez. Uma experiência que vai além do corte.',
  foundedYear: 2018,
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5511975369904',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alisonestevam.com.br',
  instagram: 'https://instagram.com/alisonestevam',
  address: {
    street: 'Rua Portugal, 443',
    neighborhood: 'Jardim Celani',
    city: 'Salto',
    state: 'SP',
    zip: '13326-145',
  },
} as const

export const BRAND_COLORS = {
  charcoal:    '#2E2E2B',
  charcoalMid: '#2E2E2B',
  charcoalDeep:'#1E1E1C',
  sage:        '#4B4D39',
  sageLight:   '#5F6248',
  offwhite:    '#F1F1F1',
  offwhiteWarm:'#E9E9E5',
  cream:       '#F1F1F1',
  gold:        '#CBA339',
  goldLight:   '#D9B761',
  olive:       '#4B4D39',
} as const

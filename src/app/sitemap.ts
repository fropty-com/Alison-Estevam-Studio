import type { MetadataRoute } from 'next'
import { BRAND } from '@/config/brand'
import { createServiceClient } from '@/lib/supabase/server'

// Rotas institucionais estáticas — fluxos de agendamento/checkout/área do
// cliente ficam de fora de propósito (exigem sessão ou código de referência,
// não fazem sentido indexados).
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '',              priority: 1,   changeFrequency: 'monthly' },
  { path: '/sobre',        priority: 0.6, changeFrequency: 'yearly' },
  { path: '/produtos',     priority: 0.8, changeFrequency: 'weekly' },
  { path: '/agendar',      priority: 0.9, changeFrequency: 'monthly' },
  { path: '/entrar',       priority: 0.5, changeFrequency: 'yearly' },
  { path: '/termos',       priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacidade',  priority: 0.2, changeFrequency: 'yearly' },
  { path: '/licencas',     priority: 0.1, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${BRAND.siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))

  const db = await createServiceClient()
  const { data: products } = await db
    .from('products')
    .select('slug, updated_at')
    .eq('active', true)

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url:             `${BRAND.siteUrl}/produtos/${p.slug}`,
    lastModified:    p.updated_at ? new Date(p.updated_at) : lastModified,
    changeFrequency: 'weekly',
    priority:        0.7,
  }))

  return [...staticEntries, ...productEntries]
}

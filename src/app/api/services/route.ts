import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 300 // cache 5 min

// Emergency fallback — only used if the DB is unreachable. Kept in sync
// with the real catalog so a transient outage doesn't show wrong prices.
const FALLBACK_SERVICES = [
  { id: 'cabelo',            name: 'Cabelo',            slug: 'cabelo',            description: 'Corte com técnica precisa, respeitando o rosto e o estilo. Inclui lavagem e finalização.', duration: 60,  price: 70,  is_whatsapp_only: false, position: 1 },
  { id: 'barba',             name: 'Barba',             slug: 'barba',             description: 'Modelagem e acabamento com navalha, com barboterapia a vapor para preparar a pele.',        duration: 60,  price: 70,  is_whatsapp_only: false, position: 2 },
  { id: 'cabelo-e-barba',    name: 'Cabelo e Barba',    slug: 'cabelo-e-barba',    description: 'A experiência completa: corte e barba em um único atendimento.',                            duration: 120, price: 110, is_whatsapp_only: false, position: 3 },
  { id: 'corte-feminino',    name: 'Corte Feminino',    slug: 'corte-feminino',    description: 'Corte personalizado, com lavagem e finalização.',                                           duration: 60,  price: 100, is_whatsapp_only: false, position: 4 },
  { id: 'horario-exclusivo', name: 'Horário Exclusivo', slug: 'horario-exclusivo', description: 'Atendimento fora do expediente para quem busca flexibilidade.',                             duration: 60,  price: 110, is_whatsapp_only: true,  position: 5 },
]

export async function GET() {
  try {
    const db = await createServiceClient() as any

    const result = await db
      .from('services')
      .select('id, name, slug, description, duration, price, is_whatsapp_only, position')
      .eq('active', true)
      .order('position', { ascending: true })

    const data  = result.data  as { id: string; name: string; slug: string; description: string; duration: number; price: number; is_whatsapp_only: boolean; position: number }[] | null
    const error = result.error as unknown

    if (error) console.error('GET /api/services error:', error)

    const services = (data && data.length > 0) ? data : FALLBACK_SERVICES

    return NextResponse.json({ services })
  } catch (error) {
    console.error('GET /api/services unexpected error:', error)
    return NextResponse.json({ services: FALLBACK_SERVICES })
  }
}

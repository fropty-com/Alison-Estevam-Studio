import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 300 // cache 5 min

type ComplementRow = { id: string; name: string; slug: string; description: string; price: number | null; position: number }

// Emergency fallback — only used if the DB is unreachable.
const FALLBACK_COMPLEMENTS: ComplementRow[] = [
  { id: 'design-sobrancelha',   name: 'Design de Sobrancelha', slug: 'design-sobrancelha',   description: 'Definição precisa com navalha. Resultado limpo e natural.',                    price: 30,   position: 1 },
  { id: 'hidratacao-capilar',   name: 'Hidratação Capilar',    slug: 'hidratacao-capilar',   description: 'Reposição de nutrientes para cabelos ressecados. Resultado visível já na primeira sessão.', price: 30,   position: 2 },
  { id: 'revitalizacao-facial', name: 'Revitalização Facial',  slug: 'revitalizacao-facial', description: 'Cuidado rápido e eficaz para a pele do rosto. Limpeza e aparência renovada.',    price: 30,   position: 3 },
  { id: 'contorno-barba',       name: 'Contorno de Barba',     slug: 'contorno-barba',       description: 'Acabamento com navalha.',                                                       price: 30,   position: 4 },
  { id: 'acabamento-cabelo',    name: 'Acabamento de Cabelo',  slug: 'acabamento-cabelo',    description: 'Finalização durante a barba.',                                                  price: null, position: 5 },
]

/**
 * GET /api/complements?serviceId=<uuid>
 * Without serviceId: all active complements.
 * With serviceId: only complements offered for that service (per service_complements).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get('serviceId')

  try {
    const db = await createServiceClient() as any

    if (serviceId) {
      const { data, error } = await db
        .from('service_complements')
        .select('complements(id, name, slug, description, price, position)')
        .eq('service_id', serviceId)

      if (error) console.error('GET /api/complements error:', error)

      const complements = ((data ?? []) as { complements: ComplementRow | null }[])
        .map(row => row.complements)
        .filter((c: ComplementRow | null): c is ComplementRow => c !== null)
        .sort((a, b) => a.position - b.position)

      return NextResponse.json({ complements })
    }

    const { data, error } = await db
      .from('complements')
      .select('id, name, slug, description, price, position')
      .eq('active', true)
      .order('position', { ascending: true })

    if (error) console.error('GET /api/complements error:', error)

    return NextResponse.json({ complements: data ?? FALLBACK_COMPLEMENTS })
  } catch (error) {
    console.error('GET /api/complements unexpected error:', error)
    // Without a working DB we can't know the real per-service mapping —
    // showing the full catalog beats showing nothing.
    return NextResponse.json({ complements: FALLBACK_COMPLEMENTS })
  }
}

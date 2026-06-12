import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 300 // cache 5 min

export async function GET() {
  const db = await createServiceClient() as any

  // eslint-disable-next-line prefer-const
  let result = await db
    .from('services')
    .select('id, name, slug, description, duration, price, position')
    .eq('active', true)
    .order('position', { ascending: true })

  const data  = result.data  as { id: string; name: string; slug: string; description: string; duration: number; price: number; position: number }[] | null
  const error = result.error as unknown

  if (error) {
    console.error('GET /api/services error:', error)
    return NextResponse.json({ error: 'Erro ao carregar serviços.' }, { status: 500 })
  }

  return NextResponse.json({ services: data ?? [] })
}

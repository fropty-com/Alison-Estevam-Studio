import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 300 // cache 5 min

export async function GET() {
  const db = await createServiceClient() as any

  const { data, error } = await db
    .from('services')
    .select('id, name, slug, description, duration, price, position')
    .eq('active', true)
    .order('position', { ascending: true })
    as { data: { id: string; name: string; slug: string; description: string; duration: number; price: number; position: number }[] | null; error: unknown }

  if (error) {
    console.error('GET /api/services error:', error)
    return NextResponse.json({ error: 'Erro ao carregar serviços.' }, { status: 500 })
  }

  return NextResponse.json({ services: data ?? [] })
}

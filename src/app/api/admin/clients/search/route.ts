import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/admin-auth'

// Not covered by middleware (matcher is /admin/:path*, not /api/admin/:path*)
// and returns client PII, so it needs its own auth check.
export async function GET(request: NextRequest) {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ clients: [] })

  const db = await createServiceClient() as any
  const { data } = await db
    .from('clients')
    .select('id, name, whatsapp, email')
    .or(`name.ilike.%${q}%,whatsapp.ilike.%${q}%`)
    .limit(8)

  return NextResponse.json({ clients: data ?? [] })
}

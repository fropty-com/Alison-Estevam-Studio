import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/admin-auth'

// Not covered by middleware (matcher is /admin/:path*, not /api/admin/:path*),
// so it needs its own auth check like /api/admin/clients/search.
export async function GET() {
  const user = await getAdminUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const db = await createServiceClient() as any
  const { count } = await db
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return NextResponse.json({ count: count ?? 0 })
}

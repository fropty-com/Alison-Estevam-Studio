import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'

export type StaffRole = 'owner' | 'staff'

/**
 * Current admin's Supabase Auth user, read from the session cookie.
 * Safe to call from Server Components and Server Actions — cookie writes
 * (token refresh) are swallowed when called from a Server Component, same
 * as the client-area session helper.
 */
export async function getAdminUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Server Component — cookies can't be set; ignore
          }
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Role of the currently logged-in admin ('owner' | 'staff'), or null if not
 * logged in or not provisioned in staff_members. Distinguishes the business
 * owner (full access, including financial reports) from staff (day-to-day
 * operations only) — see migration 011_staff_roles.
 */
export async function getAdminRole(): Promise<StaffRole | null> {
  const user = await getAdminUser()
  if (!user) return null

  const db = await createServiceClient() as any
  const { data } = await db
    .from('staff_members')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return (data?.role as StaffRole | undefined) ?? null
}

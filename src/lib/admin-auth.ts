import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'

export type StaffRole = 'owner' | 'staff'

/**
 * Whether a Supabase Auth user id is provisioned as staff. This is the real
 * admin-access gate — being an authenticated Supabase Auth user is NOT
 * enough on its own (any of the project's Auth accounts, including ones
 * with no staff_members row, could otherwise reach /admin and call admin
 * Server Actions, since those only checked "is authenticated").
 */
export async function isStaffMember(userId: string): Promise<boolean> {
  const db = await createServiceClient() as any
  const { data } = await db.from('staff_members').select('id').eq('id', userId).maybeSingle()
  return !!data
}

/**
 * Current admin's Supabase Auth user, read from the session cookie —
 * returns null unless the user is both authenticated AND provisioned in
 * staff_members. Safe to call from Server Components and Server Actions —
 * cookie writes (token refresh) are swallowed when called from a Server
 * Component, same as the client-area session helper.
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
  if (!user) return null
  if (!(await isStaffMember(user.id))) return null
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

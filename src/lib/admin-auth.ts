import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'

export type StaffRole = 'owner' | 'staff'

/**
 * Bridges a WhatsApp-OTP-verified staff phone into a real Supabase Auth
 * admin session, without a password: mint a one-time magic-link token via
 * the admin API, then redeem it through the cookie-aware SSR client so the
 * browser gets the same session cookies loginAction() would set. Only a
 * phone an owner explicitly registered on staff_members.phone can ever
 * reach this — clients can't self-promote. Shared by /entrar (client-facing
 * phone login, staff phones bridge straight into /admin) and /admin/login's
 * own phone tab.
 */
export async function establishStaffSession(staffId: string): Promise<{ error?: string }> {
  const serviceDb = await createServiceClient()
  const { data: userData, error: userError } = await serviceDb.auth.admin.getUserById(staffId)
  if (userError || !userData?.user?.email) return { error: 'Erro ao acessar conta administrativa.' }

  const { data: linkData, error: linkError } = await serviceDb.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user.email,
  })
  if (linkError || !linkData?.properties?.hashed_token) return { error: 'Erro ao gerar sessão administrativa.' }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: linkData.properties.hashed_token,
  })
  if (verifyError) return { error: 'Erro ao autenticar. Tente novamente.' }

  return {}
}

/**
 * Whether a Supabase Auth user id is provisioned as staff. This is the real
 * admin-access gate — being an authenticated Supabase Auth user is NOT
 * enough on its own (any of the project's Auth accounts, including ones
 * with no staff_members row, could otherwise reach /admin and call admin
 * Server Actions, since those only checked "is authenticated").
 */
export async function isStaffMember(userId: string): Promise<boolean> {
  const db = await createServiceClient()
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

  const db = await createServiceClient()
  const { data } = await db
    .from('staff_members')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return (data?.role as StaffRole | undefined) ?? null
}

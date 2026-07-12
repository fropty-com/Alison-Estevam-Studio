import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Server-side Supabase client.
 * Use in Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
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
}

/**
 * Service-role client — bypasses RLS.
 * ONLY use in server-side code that runs as admin (Route Handlers, Edge Functions).
 * Never expose to the client.
 *
 * Deliberately NOT session/cookie-aware: `createServerClient` from `@supabase/ssr`
 * prioritizes a logged-in user's session token over the service_role key whenever
 * a session cookie is present, silently downgrading these queries to the
 * `authenticated` role (which has no RLS access to most tables) instead of
 * `service_role`. A plain client sidesteps that entirely.
 */
export async function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

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
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Next.js patches global fetch and can cache/dedupe GET requests by URL
      // even on force-dynamic routes; without this, PostgREST responses for a
      // given query shape can get stuck serving a stale (e.g. empty) result.
      global: { fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }) },
    }
  )
}

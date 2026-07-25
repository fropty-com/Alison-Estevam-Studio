import { createServiceClient } from '@/lib/supabase/server'

/**
 * Fixed-window rate limit backed by the `rate_limits` table / the
 * `check_rate_limit` Postgres function (atomic — avoids the classic
 * read-then-write race where two concurrent requests both get allowed).
 * Fails open: if the check itself errors, we don't want a limiter bug to
 * take down a real feature, so the request is allowed through.
 */
export async function checkRateLimit(key: string, windowSeconds: number, max: number): Promise<boolean> {
  const db = await createServiceClient() as any
  const { data, error } = await db.rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max: max,
  })
  if (error) {
    console.error('Rate limit check failed:', error)
    return true
  }
  return data as boolean
}

/** Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

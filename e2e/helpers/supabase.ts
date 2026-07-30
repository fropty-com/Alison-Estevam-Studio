import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// playwright.config.ts runs standalone (not through Next.js), so .env.local
// isn't loaded automatically the way it is for `next dev`/`next build`.
const envPath = path.resolve(__dirname, '../../.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim())
    if (m) process.env[m[1].trim()] ??= m[2].trim()
  }
}

export const testDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Every E2E-created client/appointment is tagged so cleanup can find it
 * unambiguously — this app has no multi-tenant/is_demo column, so a
 * distinctive WhatsApp/reference-code prefix is the isolation mechanism. */
export const E2E_MARKER = 'E2E-TEST'

export function e2ePhone(suffix: string): string {
  return `+55119${suffix.padStart(8, '0')}`
}

export async function cleanupE2EClient(whatsapp: string) {
  const { data: client } = await testDb.from('clients').select('id').eq('whatsapp', whatsapp).maybeSingle()
  if (!client) return

  const { data: appts } = await testDb.from('appointments').select('id, slot_id').eq('client_id', client.id)
  for (const appt of appts ?? []) {
    await testDb.from('payments').delete().eq('appointment_id', appt.id)
    await testDb.from('reviews').delete().eq('appointment_id', appt.id)
    await testDb.from('appointments').delete().eq('id', appt.id)
    if (appt.slot_id) await testDb.from('time_slots').update({ status: 'available' }).eq('id', appt.slot_id)
  }
  await testDb.from('clients').delete().eq('id', client.id)
}

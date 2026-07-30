// One-off: creates a temporary Supabase Auth user + staff_members row for
// live browser QA of the admin panel (Fase 5 responsive/theme audit).
// Prints the credentials to stdout — never commit them. Run
// temp-qa-admin-delete.mjs afterward to remove both rows.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim())
  if (m) process.env[m[1].trim()] = process.env[m[1].trim()] ?? m[2].trim()
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const email = 'qa-fase5-temp@example.com'
const password = `Qa${randomUUID().replace(/-/g, '').slice(0, 20)}!`

const { data: created, error: authError } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})
if (authError) throw authError

const { error: staffError } = await db.from('staff_members').insert({
  id: created.user.id,
  name: 'QA Fase 5 (temporário)',
  role: 'staff',
})
if (staffError) throw staffError

console.log('Temp admin created:')
console.log('  email:', email)
console.log('  password:', password)
console.log('  user id:', created.user.id)

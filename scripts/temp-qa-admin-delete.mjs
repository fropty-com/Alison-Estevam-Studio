// Removes the temporary QA admin account created by temp-qa-admin-create.mjs.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim())
  if (m) process.env[m[1].trim()] = process.env[m[1].trim()] ?? m[2].trim()
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data: users } = await db.auth.admin.listUsers()
const target = users.users.find(u => u.email === 'qa-fase5-temp@example.com')
if (!target) {
  console.log('Temp QA admin not found — already removed.')
  process.exit(0)
}

await db.from('staff_members').delete().eq('id', target.id)
await db.auth.admin.deleteUser(target.id)
console.log('Temp admin removed:', target.id)

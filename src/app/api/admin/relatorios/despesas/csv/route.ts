import { createServiceClient } from '@/lib/supabase/server'
import { getAdminRole } from '@/lib/admin-auth'
import { toCsv, csvResponse } from '@/lib/csv'
import { format } from 'date-fns'
import { todayInSaoPaulo } from '@/lib/timezone'

export async function GET() {
  const role = await getAdminRole()
  if (role !== 'owner') return new Response('Não autorizado.', { status: 403 })

  const db = await createServiceClient() as any

  const { data } = await db
    .from('expenses')
    .select('description, category, amount, is_fixed, due_date, paid_date')
    .order('due_date', { ascending: false })
    .limit(1000)

  const rows = ((data ?? []) as any[]).map(e => [
    e.description,
    e.category,
    e.is_fixed ? 'Fixa' : 'Variável',
    Number(e.amount ?? 0).toFixed(2),
    format(new Date(`${e.due_date}T00:00:00`), 'dd/MM/yyyy'),
    e.paid_date ? format(new Date(`${e.paid_date}T00:00:00`), 'dd/MM/yyyy') : 'Não paga',
  ])

  const csv = toCsv(
    ['Descrição', 'Categoria', 'Tipo', 'Valor', 'Vencimento', 'Data de pagamento'],
    rows
  )

  return csvResponse(`despesas-${todayInSaoPaulo()}.csv`, csv)
}

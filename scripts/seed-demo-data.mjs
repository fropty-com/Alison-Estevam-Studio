// One-off script to populate the Supabase project with realistic demo data
// spanning 12 months back / 3 months forward from today, for validating every
// admin card/panel (Dashboard, Agenda, Clientes, Servicos, Faturamento,
// Financeiro, Operacional, Relatorios, Atividade). Confirmed with the user
// that the 8 existing clients/13 appointments are the user's own test data,
// not a live customer base — this ADDS on top of them, nothing is deleted.
//
// Run once: node scripts/seed-demo-data.mjs
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim())
  if (m) process.env[m[1].trim()] = process.env[m[1].trim()] ?? m[2].trim()
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const TODAY = new Date('2026-07-30T12:00:00Z')
const STAFF_ID = '4d587f72-90da-4c78-a426-afa5870726c9' // Alison Estevam

// ---------- helpers ----------
function pad(n) { return String(n).padStart(2, '0') }
function toISODate(d) { return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` }
function addDays(d, n) { const r = new Date(d); r.setUTCDate(r.getUTCDate() + n); return r }
function weekday(d) { return d.getUTCDay() }
function rand(n) { return Math.floor(Math.random() * n) }
function pick(arr) { return arr[rand(arr.length)] }
function weightedPick(pairs) {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [v, w] of pairs) { if ((r -= w) <= 0) return v }
  return pairs[pairs.length - 1][0]
}
function minutesToHHMM(m) { return `${pad(Math.floor(m / 60))}:${pad(m % 60)}` }

// weekday (0=Sun..6=Sat) -> business windows in minutes, from availability_rules
const RULES = {
  1: [[600, 720], [900, 1200]], // Mon 10-12, 15-20
  2: [[600, 720], [900, 1200]], // Tue
  3: [[900, 1200]],             // Wed 15-20 only
  4: [[600, 720], [900, 1200]], // Thu
  5: [[600, 720]],              // Fri 10-12 only
  6: [[480, 900]],              // Sat 8-15
}
const SLOT_MIN = 60

function slotsForDay(d) {
  const rules = RULES[weekday(d)]
  if (!rules) return []
  const out = []
  for (const [start, end] of rules) for (let m = start; m + SLOT_MIN <= end; m += SLOT_MIN) out.push(m)
  return out
}

// ---------- reference data ----------
const SERVICES = [
  { id: 'da6695a3-8a1b-49c5-a3cb-b1a772acb412', name: 'Cabelo', price: 70, weight: 30 },
  { id: '84c88e6b-f2ce-46d0-bf45-6e79822684ad', name: 'Barba', price: 70, weight: 22 },
  { id: 'd55ca5cd-4968-41c2-921a-644f5b0e3d01', name: 'Cabelo e Barba', price: 110, weight: 25 },
  { id: 'de86b525-7f97-43d8-b0f5-aaaf1b7df23c', name: 'Corte Feminino', price: 100, weight: 8 },
  { id: 'e3488012-52bb-4d6a-b4f5-98e056bdbe0e', name: 'Design de Sobrancelha', price: 30, weight: 5 },
  { id: 'd88f549d-2472-4b65-b9e3-276f578000cb', name: 'Hidratação Capilar', price: 30, weight: 4 },
  { id: 'd50b4c7d-778c-4f14-b6ed-9f68a102112d', name: 'Revitalização Facial', price: 30, weight: 3 },
  { id: 'a63f1f55-8fe2-4e95-88ee-3da4199c1fcc', name: 'Contorno de Barba', price: 30, weight: 3 },
]
const SERVICE_WEIGHTS = SERVICES.map(s => [s, s.weight])

const EXPENSE_CATEGORIES = [
  ['Aluguel', 1800, 1800, true],
  ['Energia', 220, 420, false],
  ['Água', 90, 160, false],
  ['Internet', 130, 130, true],
  ['Produtos', 150, 600, false],
  ['Materiais descartáveis', 80, 300, false],
  ['Limpeza', 100, 250, false],
  ['Marketing', 100, 500, false],
  ['Software', 60, 150, true],
  ['Manutenção', 80, 400, false],
  ['Impostos', 300, 900, false],
  ['Taxas bancárias', 20, 70, false],
]

const FIRST_NAMES_M = ['Lucas', 'Gabriel', 'Matheus', 'Pedro', 'Felipe', 'Rodrigo', 'André', 'Marcelo', 'Diego', 'Vinícius', 'Leonardo', 'Gustavo', 'Eduardo', 'Caio']
const FIRST_NAMES_F = ['Beatriz', 'Larissa', 'Fernanda', 'Amanda', 'Patrícia', 'Renata', 'Bruna', 'Carolina', 'Vanessa', 'Priscila', 'Aline', 'Débora']
const LAST_NAMES = ['Almeida', 'Pereira', 'Costa', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Barbosa', 'Cardoso', 'Teixeira', 'Moreira', 'Nascimento', 'Araujo', 'Correia', 'Pinto', 'Freitas', 'Ramos', 'Batista', 'Monteiro', 'Cavalcanti', 'Melo', 'Duarte', 'Vieira', 'Machado', 'Lopes']

function randomName(i) {
  const female = i % 3 === 0
  const first = pick(female ? FIRST_NAMES_F : FIRST_NAMES_M)
  const last = pick(LAST_NAMES)
  return { name: `${first} ${last}`, female }
}

console.log('Gerando dados demo...')

// ---------- 1. Clients (25 new) ----------
const clients = []
for (let i = 0; i < 25; i++) {
  const { name } = randomName(i)
  const daysAgoCreated = rand(365)
  const createdAt = addDays(TODAY, -daysAgoCreated)
  // groups per spec (a client can belong to more than one)
  const isVip = i < 4
  const isNewThisMonth = i >= 4 && i < 9 // 5 novos
  const inactive30 = i >= 9 && i < 12
  const inactive60 = i >= 12 && i < 14
  const highCancel = i >= 14 && i < 16
  const noShowRepeat = i === 16
  const birthdayThisMonth = i >= 17 && i < 21   // 4 aniversariantes julho
  const birthdayNextMonth = i >= 21 && i < 25   // 4 aniversariantes agosto

  let birthDate = null
  if (birthdayThisMonth) birthDate = `1990-07-${pad(1 + rand(28))}`
  else if (birthdayNextMonth) birthDate = `1988-08-${pad(1 + rand(28))}`
  else if (rand(2) === 0) birthDate = `${1985 + rand(15)}-${pad(1 + rand(12))}-${pad(1 + rand(28))}`

  clients.push({
    id: randomUUID(),
    name,
    whatsapp: `+551199${String(100000 + i).padStart(6, '0')}`,
    email: `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '.')}@example.com`,
    vip: isVip,
    birth_date: birthDate,
    created_at: isNewThisMonth ? addDays(TODAY, -rand(20)).toISOString() : createdAt.toISOString(),
    notes: highCancel ? 'Cliente com histórico de cancelamentos frequentes.'
      : noShowRepeat ? 'Já faltou mais de uma vez sem avisar.'
      : isVip ? 'Cliente fiel, prefere atendimento no fim da tarde.'
      : null,
    consent_whatsapp: rand(10) > 0,
    consent_terms: true,
    _group: { isVip, isNewThisMonth, inactive30, inactive60, highCancel, noShowRepeat },
  })
}

const { error: clientsErr } = await db.from('clients').insert(clients.map(({ _group, ...c }) => c))
if (clientsErr) throw clientsErr
console.log(`✓ ${clients.length} clientes`)

// ---------- 2. Appointments + time_slots + payments ----------
const { data: existingSlots } = await db.from('time_slots').select('date, start_time')
const used = new Set((existingSlots ?? []).map(s => `${s.date}|${s.start_time.slice(0, 5)}`))

const RANGE_START = new Date('2025-08-01T12:00:00Z')
const RANGE_END = new Date('2026-10-31T12:00:00Z')

const dayList = []
for (let d = new Date(RANGE_START); d <= RANGE_END; d = addDays(d, 1)) {
  if (slotsForDay(d).length > 0) dayList.push(new Date(d))
}

const appointmentsToInsert = []
const slotsToInsert = []
const paymentsToInsert = []
const auditToInsert = []
const reviewsToInsert = []
const couponRedemptionsToInsert = []

let refCounter = 1
function nextRefCode() { return `AE-SEED${String(refCounter++).padStart(4, '0')}` }

// coupon placeholder ids (created later, referenced here)
const BEMVINDO_ID = randomUUID()

let completedCount = 0, cancelledCount = 0, noShowCount = 0, refundsMade = 0

for (const day of dayList) {
  const isPast = day < TODAY
  const isToday = toISODate(day) === toISODate(TODAY)
  const isFuture = day > TODAY
  // ~2.3 appointments/business day on average across ~320 business days -> 150+
  const targetCount = Math.random() < 0.55 ? 1 : (Math.random() < 0.85 ? 2 : 3)
  const daySlots = slotsForDay(day)
  const chosenMinutes = new Set()

  for (let k = 0; k < targetCount; k++) {
    const startMin = pick(daySlots)
    const key = `${toISODate(day)}|${minutesToHHMM(startMin)}`
    if (used.has(key) || chosenMinutes.has(startMin)) continue
    chosenMinutes.add(startMin)
    used.add(key)

    const client = pick(clients)
    const service = weightedPick(SERVICE_WEIGHTS)
    const slotId = randomUUID()
    const apptId = randomUUID()
    const refCode = nextRefCode()

    slotsToInsert.push({
      id: slotId,
      date: toISODate(day),
      start_time: minutesToHHMM(startMin),
      end_time: minutesToHHMM(startMin + SLOT_MIN),
      status: 'booked',
    })

    let status
    if (isPast) status = weightedPick([['completed', 75], ['cancelled', 10], ['no_show', 10], ['cancelled_est', 5]])
    else if (isToday) status = weightedPick([['completed', 30], ['confirmed', 30], ['checked_in', 10], ['pending', 30]])
    else status = weightedPick([['confirmed', 55], ['pending', 45]])

    const isManual = Math.random() < 0.2
    const source = isManual ? 'presencial' : 'online'
    const dbStatus = status === 'cancelled_est' ? 'cancelled' : status
    const cancelReason = status === 'cancelled' ? 'Cliente pediu para remarcar depois' : status === 'cancelled_est' ? 'Ajuste de agenda do estabelecimento' : null

    let discount = 0
    let couponRedemption = null
    if (dbStatus === 'completed' && Math.random() < 0.12) {
      discount = Math.round(service.price * 0.10 * 100) / 100
      couponRedemption = { coupon_id: BEMVINDO_ID, appointment_id: apptId, discount_amount: discount, created_at: day.toISOString() }
    }

    const totalPrice = service.price
    appointmentsToInsert.push({
      id: apptId,
      reference_code: refCode,
      client_id: client.id,
      service_id: service.id,
      slot_id: slotId,
      status: dbStatus,
      notes: null,
      cancelled_at: (dbStatus === 'cancelled' || dbStatus === 'no_show') ? day.toISOString() : null,
      cancellation_reason: dbStatus === 'cancelled' ? cancelReason : null,
      created_at: addDays(day, -rand(5) - 1).toISOString(),
      service_price: service.price,
      complements_price: 0,
      total_price: totalPrice,
      checked_in_at: (dbStatus === 'completed' || dbStatus === 'checked_in') ? day.toISOString() : null,
      started_at: dbStatus === 'completed' ? day.toISOString() : null,
      checked_out_at: dbStatus === 'completed' ? day.toISOString() : null,
      discount,
      source,
    })

    if (isManual) {
      auditToInsert.push({
        actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'appointment.manual_create',
        target_type: 'appointment', target_id: apptId,
        summary: `Criou agendamento manual #${refCode} para ${client.name} (${service.name})`,
        metadata: { serviceId: service.id }, created_at: addDays(day, -rand(5) - 1).toISOString(),
      })
    }

    if (dbStatus === 'completed') {
      completedCount++
      const method = weightedPick([['pix', 35], ['credit_card', 25], ['debit_card', 15], ['cash', 20], ['courtesy', 5]])
      const feePct = { pix: 0, cash: 0, courtesy: 0, debit_card: 1.99, credit_card: 3.49 }[method]
      const tip = Math.random() < 0.3 ? [5, 10, 15, 20][rand(4)] : 0
      const netBeforeFee = Math.max(0, totalPrice - discount)
      const feeAmount = Math.round(netBeforeFee * (feePct / 100) * 100) / 100
      const netAmount = Math.round((netBeforeFee - feeAmount) * 100) / 100 + tip
      const paymentId = randomUUID()
      const shouldRefund = refundsMade < 2 && Math.random() < 0.02
      paymentsToInsert.push({
        id: paymentId,
        appointment_id: apptId,
        method,
        gross_amount: totalPrice,
        fee_percentage: feePct,
        fee_amount: feeAmount,
        tip_amount: tip,
        net_amount: netAmount,
        paid_at: day.toISOString(),
        refunded_at: shouldRefund ? addDays(day, 2).toISOString() : null,
        refund_reason: shouldRefund ? 'Cliente insatisfeito com o serviço' : null,
      })
      if (shouldRefund) refundsMade++
      auditToInsert.push({
        actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'appointment.checkout',
        target_type: 'appointment', target_id: apptId,
        summary: `Registrou pagamento de R$ ${netAmount.toFixed(2)} (líquido) via ${method} no agendamento #${refCode}`,
        metadata: { method, grossAmount: totalPrice, discount, tipAmount: tip, feeAmount, netAmount },
        created_at: day.toISOString(),
      })
      if (shouldRefund) {
        auditToInsert.push({
          actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'payment.refund',
          target_type: 'payment', target_id: paymentId,
          summary: `Estornou pagamento de R$ ${Number(netAmount).toFixed(2)} (Cliente insatisfeito com o serviço)`,
          metadata: { reason: 'Cliente insatisfeito com o serviço' }, created_at: addDays(day, 2).toISOString(),
        })
      }
      if (couponRedemption) couponRedemptionsToInsert.push(couponRedemption)
      if (Math.random() < 0.12) {
        reviewsToInsert.push({
          client_id: client.id, appointment_id: apptId, service_id: service.id,
          rating: weightedPick([[5, 55], [4, 30], [3, 10], [2, 4], [1, 1]]),
          comment: pick([
            'Atendimento excelente, super recomendo!', 'Corte ficou ótimo, voltarei sempre.',
            'Ambiente agradável e profissional pontual.', 'Muito bom, mas achei o valor um pouco alto.',
            null, null,
          ]),
          created_at: addDays(day, 1).toISOString(),
        })
      }
    } else if (dbStatus === 'cancelled') {
      cancelledCount++
    } else if (dbStatus === 'no_show') {
      noShowCount++
    }
  }
}

console.log(`Preparados: ${appointmentsToInsert.length} agendamentos (${completedCount} concluídos, ${cancelledCount} cancelados, ${noShowCount} no-show), ${paymentsToInsert.length} pagamentos (${refundsMade} estornados)`)

async function batchInsert(table, rows, chunkSize = 300) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const { error } = await db.from(table).insert(rows.slice(i, i + chunkSize))
    if (error) throw new Error(`${table}: ${error.message}`)
  }
}

await batchInsert('time_slots', slotsToInsert)
console.log(`✓ ${slotsToInsert.length} time_slots`)
await batchInsert('appointments', appointmentsToInsert)
console.log(`✓ ${appointmentsToInsert.length} appointments`)

// ---------- 3. Coupons ----------
const coupons = [
  { id: BEMVINDO_ID, code: 'BEMVINDO10', discount_type: 'percentage', discount_value: 10, max_uses: null, uses_count: couponRedemptionsToInsert.length, expires_at: null, active: true, created_at: addDays(TODAY, -300).toISOString() },
  { id: randomUUID(), code: 'VERAO25', discount_type: 'percentage', discount_value: 25, max_uses: 50, uses_count: 12, expires_at: toISODate(addDays(TODAY, -60)), active: true, created_at: addDays(TODAY, -200).toISOString() },
  { id: randomUUID(), code: 'FIDELIDADE5', discount_type: 'fixed', discount_value: 5, max_uses: 5, uses_count: 5, expires_at: null, active: true, created_at: addDays(TODAY, -150).toISOString() },
]
await batchInsert('coupons', coupons)
console.log(`✓ ${coupons.length} cupons`)
for (const c of coupons) {
  auditToInsert.push({
    actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'coupon.create',
    target_type: 'coupon', target_id: c.id,
    summary: `Criou o cupom ${c.code} (${c.discount_type === 'percentage' ? `${c.discount_value}%` : `R$ ${c.discount_value}`})`,
    metadata: { code: c.code }, created_at: c.created_at,
  })
}

await batchInsert('payments', paymentsToInsert)
console.log(`✓ ${paymentsToInsert.length} payments`)
if (couponRedemptionsToInsert.length) {
  await batchInsert('coupon_redemptions', couponRedemptionsToInsert)
  console.log(`✓ ${couponRedemptionsToInsert.length} coupon_redemptions`)
}
if (reviewsToInsert.length) {
  await batchInsert('reviews', reviewsToInsert)
  console.log(`✓ ${reviewsToInsert.length} reviews`)
}

// ---------- 4. Expenses (45+) ----------
const expenses = []
for (let i = 0; i < 48; i++) {
  const [category, min, max, isFixed] = pick(EXPENSE_CATEGORIES)
  const monthsAgo = rand(13) - 1 // -1 (next month) .. 11 (11 months ago)
  const dueDate = addDays(TODAY, -monthsAgo * 30 + rand(20) - 10)
  const amount = Math.round((min + Math.random() * (max - min)) * 100) / 100
  const isOverdue = dueDate < TODAY && Math.random() < 0.08
  const isPaid = dueDate < TODAY && !isOverdue
  const paidDate = isPaid ? addDays(dueDate, rand(5)) : null
  expenses.push({
    id: randomUUID(),
    description: `${category} — ${toISODate(dueDate).slice(0, 7)}`,
    category,
    amount,
    is_fixed: isFixed,
    due_date: toISODate(dueDate),
    paid_date: paidDate ? toISODate(paidDate) : null,
    created_at: addDays(dueDate, -rand(10) - 1).toISOString(),
  })
}
await batchInsert('expenses', expenses)
console.log(`✓ ${expenses.length} despesas`)
for (const e of expenses) {
  auditToInsert.push({
    actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'expense.create',
    target_type: 'expense', target_id: e.id,
    summary: `Registrou a despesa "${e.description}" (R$ ${e.amount.toFixed(2)}, ${e.category})`,
    metadata: { category: e.category, amount: e.amount }, created_at: e.created_at,
  })
  if (e.paid_date) {
    auditToInsert.push({
      actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'expense.mark_paid',
      target_type: 'expense', target_id: e.id, summary: 'Marcou despesa como paga',
      metadata: { paid: true }, created_at: `${e.paid_date}T15:00:00Z`,
    })
  }
}

// ---------- 5. Waitlist entries ----------
const waitlist = []
for (let i = 0; i < 15; i++) {
  const client = pick(clients)
  const service = weightedPick(SERVICE_WEIGHTS)
  const isHistorical = i < 10
  const createdAt = isHistorical ? addDays(TODAY, -rand(180) - 5) : addDays(TODAY, -rand(4))
  const status = isHistorical ? pick(['resolved', 'cancelled', 'resolved', 'notified']) : 'waiting'
  waitlist.push({
    id: randomUUID(),
    client_id: client.id,
    service_id: service.id,
    preferred_date: toISODate(addDays(createdAt, rand(10) + 1)),
    note: pick(['Prefere horário da tarde', 'Só pode aos sábados', null, 'Encaixe se possível']),
    status,
    created_at: createdAt.toISOString(),
    notified_at: status !== 'waiting' ? addDays(createdAt, rand(3) + 1).toISOString() : null,
  })
}
await batchInsert('waitlist_entries', waitlist)
console.log(`✓ ${waitlist.length} waitlist_entries`)

// ---------- 6. Loyalty redemption (for a frequent VIP client) ----------
const vipClient = clients.find(c => c._group.isVip)
if (vipClient) {
  await db.from('loyalty_redemptions').insert({
    id: randomUUID(), client_id: vipClient.id, redeemed_at: addDays(TODAY, -20).toISOString(),
    redeemed_by: STAFF_ID, notes: 'Resgate do atendimento grátis após 10 visitas.',
  })
  auditToInsert.push({
    actor_id: STAFF_ID, actor_name: 'Alison Estevam', action: 'loyalty.redeem',
    target_type: 'client', target_id: vipClient.id,
    summary: `Resgatou recompensa de fidelidade para ${vipClient.name}`,
    metadata: {}, created_at: addDays(TODAY, -20).toISOString(),
  })
  console.log('✓ 1 loyalty_redemption')
}

// ---------- 7. Activity log ----------
await batchInsert('audit_log', auditToInsert)
console.log(`✓ ${auditToInsert.length} audit_log`)

console.log('\nSeed concluído.')

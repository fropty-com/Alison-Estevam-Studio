import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/booking'
import { formatWhatsApp } from '@/lib/utils'
import { sendConfirmationEmail } from '@/lib/email/confirmation'
import { validateCoupon, redeemCoupon } from '@/lib/coupons'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const allowed = await checkRateLimit(`booking:${ip}`, 600, 8)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de agendamento. Aguarde alguns minutos e tente novamente.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = createAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { name, whatsapp, email, serviceId, slotId, complementIds, couponCode } = parsed.data
    const db = await createServiceClient()

    // 1. Verify slot is still available
    const { data: slot, error: slotError } = await db
      .from('time_slots')
      .select('id, status, date, start_time')
      .eq('id', slotId)
      .eq('status', 'available')
      .single() as { data: { id: string; date: string; start_time: string } | null; error: unknown }

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Este horário não está mais disponível.' },
        { status: 409 }
      )
    }

    // 2. Verify service exists, is active, and is bookable through this flow
    // (Horário Exclusivo is WhatsApp-only and must never reach this API)
    const { data: service, error: serviceError } = await db
      .from('services')
      .select('id, name, price, is_whatsapp_only')
      .eq('id', serviceId)
      .eq('active', true)
      .single() as { data: { id: string; name: string; price: number; is_whatsapp_only: boolean } | null; error: unknown }

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado.' },
        { status: 404 }
      )
    }

    if (service.is_whatsapp_only) {
      return NextResponse.json(
        { error: 'Este serviço é agendado apenas pelo WhatsApp.' },
        { status: 422 }
      )
    }

    // 2b. Validate complements — must be active and actually offered for this service
    let complements: { id: string; name: string; price: number | null }[] = []
    if (complementIds.length > 0) {
      const { data: validComplements } = await db
        .from('service_complements')
        .select('complements(id, name, price, active)')
        .eq('service_id', serviceId)
        .in('complement_id', complementIds) as {
          data: { complements: { id: string; name: string; price: number | null; active: boolean } | null }[] | null
        }

      complements = (validComplements ?? [])
        .map(row => row.complements)
        .filter((c): c is { id: string; name: string; price: number | null; active: boolean } => c !== null && c.active)

      if (complements.length !== complementIds.length) {
        return NextResponse.json(
          { error: 'Um ou mais complementos selecionados não estão disponíveis para este serviço.' },
          { status: 422 }
        )
      }
    }

    const complementsPrice = complements.reduce((sum, c) => sum + Number(c.price), 0)
    const subtotal = Number(service.price) + complementsPrice

    // 2c. Validate coupon, if provided — this is only an optimistic
    // pre-check (fails fast with a clear message before any writes happen).
    // It does NOT consume a use; the actual atomic redemption happens in
    // step 5b, right before the appointment is created.
    let appliedCouponId: string | null = null
    if (couponCode) {
      const result = await validateCoupon(db, couponCode, subtotal)
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 422 })
      }
      appliedCouponId = result.coupon.id
    }

    // 3. Find or create client
    const formattedWhatsapp = formatWhatsApp(whatsapp)
    let clientId: string

    const { data: existingClient } = await db
      .from('clients')
      .select('id')
      .eq('whatsapp', formattedWhatsapp)
      .maybeSingle() as { data: { id: string } | null }

    if (existingClient) {
      clientId = existingClient.id
      await db
        .from('clients')
        .update({ name, ...(email && { email }) })
        .eq('id', clientId)
    } else {
      const { data: newClient, error: clientError } = await db
        .from('clients')
        .insert({ name, whatsapp: formattedWhatsapp, email: email || null })
        .select('id')
        .single() as { data: { id: string } | null; error: unknown }

      if (clientError || !newClient) {
        return NextResponse.json(
          { error: 'Erro ao registrar cliente.' },
          { status: 500 }
        )
      }
      clientId = newClient.id
    }

    // 4. Generate reference code — a real Postgres sequence, not count(*),
    // so it stays monotonic (and collision-free) regardless of deletions.
    const { data: referenceCode, error: refError } = await db.rpc('next_appointment_reference')
    if (refError || !referenceCode) {
      console.error('Reference code generation error:', refError)
      return NextResponse.json({ error: 'Erro ao gerar código do agendamento.' }, { status: 500 })
    }

    // 5. Atomically claim the slot — condition the UPDATE on it still being
    // 'available' so two concurrent requests for the same slot can't both
    // succeed (the step-1 SELECT above is only a fast-fail pre-check; two
    // requests can both pass it before either writes). Whichever request's
    // UPDATE affects zero rows lost the race.
    const { data: claimedSlot, error: slotUpdateError } = await db
      .from('time_slots')
      .update({ status: 'booked' })
      .eq('id', slotId)
      .eq('status', 'available')
      .select('id')
      .maybeSingle() as { data: { id: string } | null; error: unknown }

    if (slotUpdateError || !claimedSlot) {
      return NextResponse.json(
        { error: 'Este horário não está mais disponível.' },
        { status: 409 }
      )
    }

    // 5b. Atomically redeem the coupon now that the slot is secured — this
    // is the authoritative check that actually consumes a use (step 2c was
    // only an optimistic pre-check). { ok: false } means the coupon was
    // exhausted/deactivated in the gap between the two, which is rare but
    // must not silently apply a discount that's no longer valid.
    let discountAmount = 0
    if (appliedCouponId) {
      const redemption = await redeemCoupon(db, appliedCouponId, subtotal)
      if (!redemption.ok) {
        await db.from('time_slots').update({ status: 'available' }).eq('id', slotId)
        return NextResponse.json(
          { error: 'Este cupom não está mais disponível. Tente novamente sem o cupom.' },
          { status: 409 }
        )
      }
      discountAmount = redemption.discountAmount
    }
    const totalPrice = Math.max(0, subtotal - discountAmount)

    const { data: appt, error: apptError } = await db.from('appointments').insert({
      reference_code:    referenceCode,
      client_id:         clientId,
      service_id:        serviceId,
      slot_id:           slotId,
      status:            'pending',
      service_price:     service.price,
      complements_price: complementsPrice,
      total_price:       totalPrice,
    }).select('id').single() as { data: { id: string } | null; error: unknown }

    if (apptError || !appt) {
      console.error('Appointment creation error:', apptError)
      // Slot and coupon use were already claimed above — release both so
      // they aren't stranded consumed with no appointment behind them.
      await db.from('time_slots').update({ status: 'available' }).eq('id', slotId)
      if (appliedCouponId) {
        await db.rpc('release_coupon', { p_coupon_id: appliedCouponId })
      }
      return NextResponse.json(
        { error: 'Erro ao criar agendamento. Tente novamente.' },
        { status: 500 }
      )
    }

    // 6. Link chosen complements (price snapshot at booking time)
    if (complements.length > 0) {
      const { error: complementsError } = await db.from('appointment_complements').insert(
        complements.map(c => ({ appointment_id: appt.id, complement_id: c.id, price: c.price }))
      )
      if (complementsError) console.error('appointment_complements insert error:', complementsError)
    }

    // 6b. Log the redemption for the bookkeeping/audit trail — the use
    // itself was already atomically consumed in step 5b.
    if (appliedCouponId) {
      const { error: redemptionLogError } = await db.from('coupon_redemptions').insert({
        coupon_id: appliedCouponId,
        appointment_id: appt.id,
        discount_amount: discountAmount,
      })
      if (redemptionLogError) console.error('coupon_redemptions insert error:', redemptionLogError)
    }

    // Send confirmation email (non-blocking — failure doesn't break the booking)
    if (email) {
      sendConfirmationEmail({
        clientName:    name,
        clientEmail:   email,
        serviceName:   service.name,
        date:          slot.date,
        startTime:     slot.start_time.substring(0, 5),
        referenceCode,
      })
    }

    return NextResponse.json({
      referenceCode,
      clientName:        name,
      serviceName:       service.name,
      complementNames:   complements.map(c => c.name),
      servicePrice:      Number(service.price),
      complementsPrice,
      discountAmount,
      totalPrice,
      date:              slot.date,
      startTime:         slot.start_time.substring(0, 5),
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/appointments:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/booking'
import { formatWhatsApp } from '@/lib/utils'
import { sendConfirmationEmail } from '@/lib/email/confirmation'
import { validateCoupon } from '@/lib/coupons'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createAppointmentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { name, whatsapp, email, serviceId, slotId, complementIds, couponCode } = parsed.data
    // Cast to any — Supabase v2.43 generics don't resolve table types reliably
    const db = await createServiceClient() as any

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

    // 2c. Validate coupon, if provided — re-checked here even though the
    // booking UI already validated it live, since this is the authoritative
    // pass (the live check doesn't consume a use).
    let discountAmount = 0
    let appliedCoupon: { id: string } | null = null
    if (couponCode) {
      const result = await validateCoupon(db, couponCode, subtotal)
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 422 })
      }
      discountAmount = result.discountAmount
      appliedCoupon = result.coupon
    }
    const totalPrice = Math.max(0, subtotal - discountAmount)

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

    // 5. Create appointment + mark slot as booked
    const [{ data: appt, error: apptError }, { error: slotUpdateError }] = await Promise.all([
      db.from('appointments').insert({
        reference_code:    referenceCode,
        client_id:         clientId,
        service_id:        serviceId,
        slot_id:           slotId,
        status:            'pending',
        service_price:     service.price,
        complements_price: complementsPrice,
        total_price:       totalPrice,
      }).select('id').single(),
      db.from('time_slots')
        .update({ status: 'booked' })
        .eq('id', slotId),
    ]) as [{ data: { id: string } | null; error: unknown }, { error: unknown }]

    if (apptError || slotUpdateError || !appt) {
      console.error('Appointment creation error:', apptError, slotUpdateError)
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

    // 6b. Record the coupon redemption and consume a use
    if (appliedCoupon) {
      const { data: currentCoupon } = await db.from('coupons').select('uses_count').eq('id', appliedCoupon.id).single()
      await Promise.all([
        db.from('coupon_redemptions').insert({
          coupon_id: appliedCoupon.id,
          appointment_id: appt.id,
          discount_amount: discountAmount,
        }),
        db.from('coupons').update({ uses_count: (currentCoupon?.uses_count ?? 0) + 1 }).eq('id', appliedCoupon.id),
      ])
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

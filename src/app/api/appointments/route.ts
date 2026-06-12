import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/booking'
import { generateReferenceCode, formatWhatsApp } from '@/lib/utils'
import { sendConfirmationEmail } from '@/lib/email/confirmation'

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

    const { name, whatsapp, email, serviceId, slotId } = parsed.data
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

    // 2. Verify service exists and is active
    const { data: service, error: serviceError } = await db
      .from('services')
      .select('id, name, price')
      .eq('id', serviceId)
      .eq('active', true)
      .single() as { data: { id: string; name: string; price: number } | null; error: unknown }

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado.' },
        { status: 404 }
      )
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

    // 4. Generate reference code
    const { count } = await db
      .from('appointments')
      .select('*', { count: 'exact', head: true }) as { count: number | null }
    const referenceCode = generateReferenceCode((count ?? 0) + 1)

    // 5. Create appointment + mark slot as booked
    const [{ error: apptError }, { error: slotUpdateError }] = await Promise.all([
      db.from('appointments').insert({
        reference_code: referenceCode,
        client_id:      clientId,
        service_id:     serviceId,
        slot_id:        slotId,
        status:         'pending',
      }),
      db.from('time_slots')
        .update({ status: 'booked' })
        .eq('id', slotId),
    ]) as [{ error: unknown }, { error: unknown }]

    if (apptError || slotUpdateError) {
      console.error('Appointment creation error:', apptError, slotUpdateError)
      return NextResponse.json(
        { error: 'Erro ao criar agendamento. Tente novamente.' },
        { status: 500 }
      )
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
      clientName:  name,
      serviceName: service.name,
      date:        slot.date,
      startTime:   slot.start_time.substring(0, 5),
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/appointments:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

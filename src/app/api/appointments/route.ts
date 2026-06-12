import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAppointmentSchema } from '@/lib/validations/booking'
import { generateReferenceCode, formatWhatsApp } from '@/lib/utils'

/**
 * POST /api/appointments
 * Creates a new appointment.
 * Validates input, creates/finds client, books slot, returns reference code.
 */
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
    const supabase = await createServiceClient()

    // 1. Verify slot is still available (optimistic lock)
    const { data: slot, error: slotError } = await supabase
      .from('time_slots')
      .select('id, status, date, start_time')
      .eq('id', slotId)
      .eq('status', 'available')
      .single()

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Este horário não está mais disponível.' },
        { status: 409 }
      )
    }

    // 2. Verify service exists and is active
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('id', serviceId)
      .eq('active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Serviço não encontrado.' },
        { status: 404 }
      )
    }

    // 3. Find or create client
    const formattedWhatsapp = formatWhatsApp(whatsapp)
    let clientId: string

    const { data: existingClientData } = await supabase
      .from('clients')
      .select('id')
      .eq('whatsapp', formattedWhatsapp)
      .maybeSingle()
    const existingClient = existingClientData as { id: string } | null

    if (existingClient) {
      clientId = existingClient.id
      // Update name if it changed
      await supabase
        .from('clients')
        .update({ name, ...(email && { email }) })
        .eq('id', clientId)
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({ name, whatsapp: formattedWhatsapp, email: email || null })
        .select('id')
        .single()

      if (clientError || !newClient) {
        return NextResponse.json(
          { error: 'Erro ao registrar cliente.' },
          { status: 500 }
        )
      }
      clientId = newClient.id
    }

    // 4. Generate reference code
    const { count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
    const referenceCode = generateReferenceCode((count ?? 0) + 1)

    // 5. Create appointment + mark slot as booked (transaction-like)
    const [{ error: apptError }, { error: slotUpdateError }] = await Promise.all([
      supabase.from('appointments').insert({
        reference_code: referenceCode,
        client_id:      clientId,
        service_id:     serviceId,
        slot_id:        slotId,
        status:         'pending',
      }),
      supabase.from('time_slots')
        .update({ status: 'booked' })
        .eq('id', slotId),
    ])

    if (apptError || slotUpdateError) {
      console.error('Appointment creation error:', apptError, slotUpdateError)
      return NextResponse.json(
        { error: 'Erro ao criar agendamento. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      referenceCode,
      clientName:  name,
      serviceName: service.name,
      date:        slot.date,
      startTime:   slot.start_time,
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/appointments:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

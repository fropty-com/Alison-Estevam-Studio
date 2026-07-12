import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { joinWaitlistSchema } from '@/lib/validations/booking'
import { formatWhatsApp } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = joinWaitlistSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { name, whatsapp, serviceId, preferredDate, note } = parsed.data
    const db = await createServiceClient() as any

    const { data: service } = await db
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .eq('active', true)
      .single() as { data: { id: string } | null }

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado.' }, { status: 404 })
    }

    const formattedWhatsapp = formatWhatsApp(whatsapp)
    let clientId: string

    const { data: existingClient } = await db
      .from('clients')
      .select('id')
      .eq('whatsapp', formattedWhatsapp)
      .maybeSingle() as { data: { id: string } | null }

    if (existingClient) {
      clientId = existingClient.id
      await db.from('clients').update({ name }).eq('id', clientId)
    } else {
      const { data: newClient, error: clientError } = await db
        .from('clients')
        .insert({ name, whatsapp: formattedWhatsapp })
        .select('id')
        .single() as { data: { id: string } | null; error: unknown }

      if (clientError || !newClient) {
        return NextResponse.json({ error: 'Erro ao registrar cliente.' }, { status: 500 })
      }
      clientId = newClient.id
    }

    const { error: waitlistError } = await db.from('waitlist_entries').insert({
      client_id: clientId,
      service_id: serviceId,
      preferred_date: preferredDate,
      note: note || null,
    })

    if (waitlistError) {
      console.error('waitlist_entries insert error:', waitlistError)
      return NextResponse.json({ error: 'Erro ao entrar na fila de espera.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/waitlist:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { validateCoupon } from '@/lib/coupons'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = typeof body.code === 'string' ? body.code : ''
    const subtotal = Number(body.subtotal)

    if (!code || !Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ valid: false, error: 'Dados inválidos.' }, { status: 422 })
    }

    const db = await createServiceClient() as any
    const result = await validateCoupon(db, code, subtotal)

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      discountAmount: result.discountAmount,
      discountLabel: result.coupon.discount_type === 'percentage'
        ? `${result.coupon.discount_value}% de desconto`
        : `R$ ${result.coupon.discount_value} de desconto`,
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/coupons/validate:', error)
    return NextResponse.json({ valid: false, error: 'Erro interno.' }, { status: 500 })
  }
}

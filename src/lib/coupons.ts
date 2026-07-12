import { format } from 'date-fns'

export interface CouponRow {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  active: boolean
}

export type CouponValidation =
  | { valid: true; coupon: CouponRow; discountAmount: number }
  | { valid: false; error: string }

/**
 * Validates a coupon against the current date/usage and computes the
 * discount for a given subtotal. Read-only — does not consume a use. Shared
 * between the live-validate endpoint (booking UI) and the authoritative
 * check at booking submission, so both apply identical rules.
 */
export async function validateCoupon(db: any, rawCode: string, subtotal: number): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { valid: false, error: 'Informe um cupom.' }

  const { data: coupon } = await db
    .from('coupons')
    .select('*')
    .eq('code', code)
    .maybeSingle() as { data: CouponRow | null }

  if (!coupon || !coupon.active) return { valid: false, error: 'Cupom inválido.' }

  const today = format(new Date(), 'yyyy-MM-dd')
  if (coupon.expires_at && coupon.expires_at < today) return { valid: false, error: 'Cupom expirado.' }
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) return { valid: false, error: 'Cupom esgotado.' }

  const discountAmount = coupon.discount_type === 'percentage'
    ? Math.round(subtotal * (coupon.discount_value / 100) * 100) / 100
    : Math.min(coupon.discount_value, subtotal)

  return { valid: true, coupon, discountAmount }
}

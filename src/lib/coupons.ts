import { todayInSaoPaulo } from '@/lib/timezone'

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

function computeDiscount(discountType: 'percentage' | 'fixed', discountValue: number, subtotal: number): number {
  return discountType === 'percentage'
    ? Math.round(subtotal * (discountValue / 100) * 100) / 100
    : Math.min(discountValue, subtotal)
}

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

  const today = todayInSaoPaulo()
  if (coupon.expires_at && coupon.expires_at < today) return { valid: false, error: 'Cupom expirado.' }
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) return { valid: false, error: 'Cupom esgotado.' }

  const discountAmount = computeDiscount(coupon.discount_type, coupon.discount_value, subtotal)

  return { valid: true, coupon, discountAmount }
}

export type CouponRedemption =
  | { ok: true; discountAmount: number }
  | { ok: false }

/**
 * Atomically re-validates and consumes one use of a coupon via the
 * `redeem_coupon` Postgres function (UPDATE...RETURNING, conditioned on the
 * same rules as validateCoupon) — a plain read-uses_count-then-write-it-back
 * has a race where two concurrent bookings can both redeem a single-use
 * coupon. Call this right before creating the appointment, after
 * validateCoupon's optimistic pre-check already passed; { ok: false } here
 * means the coupon became invalid/exhausted in the gap between the two.
 */
export async function redeemCoupon(db: any, couponId: string, subtotal: number): Promise<CouponRedemption> {
  const { data } = await db
    .rpc('redeem_coupon', { p_coupon_id: couponId })
    .maybeSingle() as { data: { discount_type: 'percentage' | 'fixed'; discount_value: number } | null }

  if (!data) return { ok: false }
  return { ok: true, discountAmount: computeDiscount(data.discount_type, data.discount_value, subtotal) }
}

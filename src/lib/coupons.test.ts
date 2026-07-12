import { describe, it, expect } from 'vitest'
import { validateCoupon, type CouponRow } from './coupons'

// Mimics the chainable Supabase query builder just enough for validateCoupon:
// db.from('coupons').select('*').eq('code', code).maybeSingle()
function mockDb(coupon: CouponRow | null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: coupon }),
        }),
      }),
    }),
  }
}

const baseCoupon: CouponRow = {
  id: 'c1',
  code: 'BEMVINDO10',
  discount_type: 'percentage',
  discount_value: 10,
  max_uses: null,
  uses_count: 0,
  expires_at: null,
  active: true,
}

describe('validateCoupon', () => {
  it('rejects an empty code without hitting the db', async () => {
    const result = await validateCoupon(mockDb(null), '   ', 100)
    expect(result.valid).toBe(false)
  })

  it('rejects a coupon that does not exist', async () => {
    const result = await validateCoupon(mockDb(null), 'NOPE', 100)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toBe('Cupom inválido.')
  })

  it('rejects an inactive coupon', async () => {
    const result = await validateCoupon(mockDb({ ...baseCoupon, active: false }), 'BEMVINDO10', 100)
    expect(result.valid).toBe(false)
  })

  it('rejects an expired coupon', async () => {
    const result = await validateCoupon(mockDb({ ...baseCoupon, expires_at: '2020-01-01' }), 'BEMVINDO10', 100)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toBe('Cupom expirado.')
  })

  it('rejects a coupon that already hit its usage limit', async () => {
    const result = await validateCoupon(mockDb({ ...baseCoupon, max_uses: 5, uses_count: 5 }), 'BEMVINDO10', 100)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.error).toBe('Cupom esgotado.')
  })

  it('accepts a coupon under its usage limit', async () => {
    const result = await validateCoupon(mockDb({ ...baseCoupon, max_uses: 5, uses_count: 4 }), 'BEMVINDO10', 100)
    expect(result.valid).toBe(true)
  })

  it('computes a percentage discount correctly', async () => {
    const result = await validateCoupon(mockDb({ ...baseCoupon, discount_value: 10 }), 'BEMVINDO10', 100)
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.discountAmount).toBe(10)
  })

  it('rounds a percentage discount to two decimal places', async () => {
    const result = await validateCoupon(mockDb({ ...baseCoupon, discount_value: 33.33 }), 'BEMVINDO10', 70)
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.discountAmount).toBe(23.33)
  })

  it('caps a fixed discount at the subtotal (never a negative total)', async () => {
    const result = await validateCoupon(
      mockDb({ ...baseCoupon, discount_type: 'fixed', discount_value: 200 }),
      'BEMVINDO10',
      70
    )
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.discountAmount).toBe(70)
  })

  it('normalizes the code to uppercase before lookup', async () => {
    const result = await validateCoupon(mockDb(baseCoupon), 'bemvindo10', 100)
    expect(result.valid).toBe(true)
  })
})

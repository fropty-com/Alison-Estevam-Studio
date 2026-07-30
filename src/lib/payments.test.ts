import { describe, it, expect } from 'vitest'
import { calculatePaymentBreakdown } from './payments'

describe('calculatePaymentBreakdown', () => {
  it('charges no fee for cash/pix (0%)', () => {
    const result = calculatePaymentBreakdown({ grossAmount: 100, discount: 0, feePercentage: 0, tipAmount: 0 })
    expect(result).toEqual({ netBeforeFee: 100, feeAmount: 0, netAmount: 100 })
  })

  it('applies the discount before computing the fee', () => {
    // R$100 - R$20 discount = R$80 netBeforeFee, fee is charged on R$80 not R$100
    const result = calculatePaymentBreakdown({ grossAmount: 100, discount: 20, feePercentage: 10, tipAmount: 0 })
    expect(result.netBeforeFee).toBe(80)
    expect(result.feeAmount).toBe(8)
    expect(result.netAmount).toBe(72)
  })

  it('clamps a discount larger than the gross amount to zero net-before-fee', () => {
    const result = calculatePaymentBreakdown({ grossAmount: 50, discount: 999, feePercentage: 5, tipAmount: 0 })
    expect(result.netBeforeFee).toBe(0)
    expect(result.feeAmount).toBe(0)
    expect(result.netAmount).toBe(0)
  })

  it('adds the tip after the fee, without charging a fee on the tip', () => {
    const result = calculatePaymentBreakdown({ grossAmount: 100, discount: 0, feePercentage: 10, tipAmount: 20 })
    // fee = 10% of 100 = 10, net before tip = 90, + 20 tip = 110
    expect(result.feeAmount).toBe(10)
    expect(result.netAmount).toBe(110)
  })

  it('clamps a negative tip to zero instead of subtracting it', () => {
    const result = calculatePaymentBreakdown({ grossAmount: 100, discount: 0, feePercentage: 0, tipAmount: -50 })
    expect(result.netAmount).toBe(100)
  })

  it('rounds fee and net amounts to 2 decimal places', () => {
    // 33.33 * 3.49% = 1.1632... -> should round to 1.16
    const result = calculatePaymentBreakdown({ grossAmount: 33.33, discount: 0, feePercentage: 3.49, tipAmount: 0 })
    expect(result.feeAmount).toBe(1.16)
    expect(result.netAmount).toBe(32.17)
  })

  it('matches the credit card fee percentage used in production (3.49%)', () => {
    const result = calculatePaymentBreakdown({ grossAmount: 110, discount: 0, feePercentage: 3.49, tipAmount: 0 })
    expect(result.feeAmount).toBe(3.84)
    expect(result.netAmount).toBe(106.16)
  })

  it('charges zero fee for courtesy regardless of gross amount', () => {
    const result = calculatePaymentBreakdown({ grossAmount: 70, discount: 70, feePercentage: 0, tipAmount: 0 })
    expect(result.netAmount).toBe(0)
  })
})

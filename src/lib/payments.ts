/**
 * Payment breakdown math shared by checkOutAppointment (server action) and
 * the demo seed script. Kept as a pure function — no Supabase, no I/O — so
 * the financial formula (the thing an audit cares about most) has exactly
 * one place it can go wrong, and that place is unit-tested.
 */
export interface PaymentBreakdownInput {
  grossAmount: number
  discount: number
  feePercentage: number
  tipAmount: number
}

export interface PaymentBreakdown {
  netBeforeFee: number
  feeAmount: number
  netAmount: number
}

export function calculatePaymentBreakdown(input: PaymentBreakdownInput): PaymentBreakdown {
  const { grossAmount, discount, feePercentage, tipAmount } = input

  // Discount applies before the fee — the barber never pays a card-processing
  // fee on the portion of the price that was discounted away.
  const netBeforeFee = Math.max(0, grossAmount - discount)
  const feeAmount = Math.round(netBeforeFee * (feePercentage / 100) * 100) / 100
  // Tip is added after the fee, and isn't itself subject to the fee — the
  // client pays the tip directly to the barber regardless of payment method.
  const netAmount = Math.round((netBeforeFee - feeAmount) * 100) / 100 + Math.max(0, tipAmount)

  return { netBeforeFee, feeAmount, netAmount }
}

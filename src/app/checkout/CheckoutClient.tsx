'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart/CartContext'
import { maskPhoneInput } from '@/lib/utils'
import { PaymentBrick, type PaymentBrickSubmitResult } from '@/components/checkout/PaymentBrick'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ShippingRate {
  id: string
  label: string
  state: string | null
  price: number
}

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.12] text-offwhite font-body font-light text-base px-3 py-[10px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/[0.2]'
const labelCls = 'block font-body font-light text-[8px] tracking-[0.25em] uppercase text-offwhite/35 mb-[6px]'

type Step = 'form' | 'payment' | 'pix' | 'error'

export function CheckoutClient({ shippingRates, mercadoPagoPublicKey }: { shippingRates: ShippingRate[]; mercadoPagoPublicKey: string | null }) {
  const { items, subtotal, clear } = useCart()
  const router = useRouter()

  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [fulfillment, setFulfillment] = useState<'retirada' | 'envio'>('retirada')
  const [shippingRateId, setShippingRateId] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')

  const [couponCode, setCouponCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)
  const [coupon, setCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)

  const [order, setOrder] = useState<{ id: string; referenceCode: string; total: number } | null>(null)
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null)

  const shippingCost = fulfillment === 'envio' ? (shippingRates.find(r => r.id === shippingRateId)?.price ?? 0) : 0
  const discountAmount = coupon?.discountAmount ?? 0
  const total = Math.max(0, subtotal + shippingCost - discountAmount)

  const canSubmit = name.trim().length > 2 && whatsapp.replace(/\D/g, '').length >= 10 &&
    (fulfillment === 'retirada' || (shippingRateId && street && number && neighborhood && city && state.length === 2 && zip.replace(/\D/g, '').length === 8))

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponApplying(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (!data.valid) {
        setCouponError(data.error ?? 'Cupom inválido.')
        setCoupon(null)
        return
      }
      setCoupon({ code: couponCode.trim().toUpperCase(), discountAmount: data.discountAmount, label: data.discountLabel })
    } catch {
      setCouponError('Erro ao validar cupom.')
    } finally {
      setCouponApplying(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          whatsapp,
          email: email || undefined,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          fulfillmentMethod: fulfillment,
          shippingRateId: fulfillment === 'envio' ? shippingRateId : undefined,
          shippingAddress: fulfillment === 'envio' ? { street, number, complement: complement || undefined, neighborhood, city, state, zip } : undefined,
          couponCode: coupon?.code,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar pedido.')
        return
      }
      setOrder({ id: data.orderId, referenceCode: data.referenceCode, total: data.total })
      setStep('payment')
    } catch {
      setError('Erro ao criar pedido. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentResult = (result: PaymentBrickSubmitResult) => {
    if (!order) return
    if (result.status === 'approved') {
      clear()
      router.push(`/pedido/${order.referenceCode}`)
      return
    }
    if (result.status === 'pending' && result.qrCode && result.qrCodeBase64) {
      clear()
      setPixData({ qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64 })
      setStep('pix')
      return
    }
    setError('Pagamento não aprovado. Verifique os dados e tente novamente.')
  }

  if (items.length === 0 && step === 'form') {
    return (
      <div className="px-6 pt-[110px] pb-24 lg:pt-[152px] text-center">
        <p className="font-body font-light text-sm text-offwhite/40 mb-6">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="font-body font-medium text-[10px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep px-6 py-[12px] inline-block hover:bg-gold-light transition-colors">
          Ver produtos
        </Link>
      </div>
    )
  }

  if (step === 'pix' && pixData && order) {
    return (
      <div className="px-6 pt-[110px] pb-24 lg:pt-[152px]">
        <div className="max-w-[420px] mx-auto text-center">
          <p className="section-tag justify-center" aria-hidden="true">Pedido {order.referenceCode}</p>
          <h1 className="font-display font-normal text-2xl tracking-[0.05em] uppercase text-offwhite mb-4">Pague com Pix</h1>
          <p className="font-body font-light text-[12px] text-offwhite/45 mb-6">
            Escaneie o QR code ou copie o código abaixo no app do seu banco. Assim que o pagamento for confirmado, você recebe um e-mail.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto mb-6 w-[220px] h-[220px]" />
          <textarea
            readOnly
            value={pixData.qrCode}
            onClick={e => (e.target as HTMLTextAreaElement).select()}
            rows={3}
            className="w-full bg-offwhite/5 border border-offwhite/[0.12] text-offwhite/70 font-data text-[10px] p-3 mb-4 resize-none"
          />
          <Link href={`/pedido/${order.referenceCode}`} className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/40 hover:text-offwhite/70 transition-colors">
            Ver status do pedido
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[152px]">
      <div className="max-w-[880px] mx-auto grid lg:grid-cols-[1fr_320px] gap-10">
        <div>
          <p className="section-tag" aria-hidden="true">Finalizar compra</p>
          <h1 className="font-display font-normal text-3xl tracking-[0.05em] uppercase text-offwhite mb-8">Checkout</h1>

          {step === 'form' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome completo</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome e sobrenome" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input type="tel" value={whatsapp} onChange={e => setWhatsapp(maskPhoneInput(e.target.value))} placeholder="(00) 00000-0000" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>E-mail (opcional)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Entrega</label>
                <div className="flex gap-2">
                  {(['retirada', 'envio'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFulfillment(f)}
                      className={`flex-1 px-4 py-[11px] font-body font-light text-[10px] tracking-[0.2em] uppercase border transition-colors ${fulfillment === f ? 'border-gold/40 bg-gold/10 text-gold' : 'border-offwhite/[0.14] text-offwhite/45 hover:border-offwhite/30'}`}
                    >
                      {f === 'retirada' ? 'Retirar na loja' : 'Receber em casa'}
                    </button>
                  ))}
                </div>
              </div>

              {fulfillment === 'envio' && (
                <div className="space-y-4 border-l-2 border-offwhite/[0.08] pl-5">
                  <div>
                    <label className={labelCls}>Faixa de frete</label>
                    <select value={shippingRateId} onChange={e => setShippingRateId(e.target.value)} className={inputCls}>
                      <option value="">Selecione…</option>
                      {shippingRates.map(r => (
                        <option key={r.id} value={r.id}>{r.label}{r.state ? ` (${r.state})` : ''} — {fmt(r.price)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-[1fr_120px] gap-4">
                    <div><label className={labelCls}>Rua</label><input type="text" value={street} onChange={e => setStreet(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Número</label><input type="text" value={number} onChange={e => setNumber(e.target.value)} className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>Complemento (opcional)</label><input type="text" value={complement} onChange={e => setComplement(e.target.value)} className={inputCls} /></div>
                  <div className="grid sm:grid-cols-[1fr_1fr_60px] gap-4">
                    <div><label className={labelCls}>Bairro</label><input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Cidade</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>UF</label><input type="text" value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} className={inputCls} /></div>
                  </div>
                  <div className="w-[160px]"><label className={labelCls}>CEP</label><input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="00000-000" className={inputCls} /></div>
                </div>
              )}

              <div>
                <label className={labelCls}>Cupom de desconto</label>
                <div className="flex gap-2">
                  <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Código" className={inputCls} />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponApplying || !couponCode.trim()}
                    className="px-5 font-body font-light text-[9px] tracking-[0.2em] uppercase border border-offwhite/[0.14] text-offwhite/50 hover:border-offwhite/30 transition-colors disabled:opacity-40"
                  >
                    {couponApplying ? '…' : 'Aplicar'}
                  </button>
                </div>
                {coupon && <p className="font-body font-light text-[10px] text-sage-light mt-2">{coupon.label} aplicado.</p>}
                {couponError && <p className="font-body font-light text-[10px] text-error/70 mt-2">{couponError}</p>}
              </div>

              {error && <p className="font-body font-light text-[11px] text-error/70">{error}</p>}

              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={!canSubmit || submitting}
                className="w-full px-6 py-[14px] font-body font-medium text-[10px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? 'Criando pedido…' : 'Ir para pagamento'}
              </button>
            </div>
          )}

          {step === 'payment' && order && (
            mercadoPagoPublicKey ? (
              <div>
                <p className="font-body font-light text-[11px] text-offwhite/40 mb-4">
                  Pedido {order.referenceCode} — {fmt(order.total)}
                </p>
                {error && <p className="font-body font-light text-[11px] text-error/70 mb-4">{error}</p>}
                <PaymentBrick
                  publicKey={mercadoPagoPublicKey}
                  orderId={order.id}
                  amount={order.total}
                  payerEmail={email}
                  onResult={handlePaymentResult}
                  onError={setError}
                />
              </div>
            ) : (
              <p className="font-body font-light text-[12px] text-error/70">
                Pagamento online indisponível no momento. Entre em contato pelo WhatsApp para finalizar seu pedido {order.referenceCode}.
              </p>
            )
          )}
        </div>

        <div className="border border-offwhite/[0.08] p-6 h-fit">
          <p className="font-body font-light text-[8.5px] tracking-[0.3em] uppercase text-offwhite/35 mb-4">Resumo</p>
          <div className="divide-y divide-offwhite/[0.07] mb-4">
            {items.map(item => (
              <div key={item.productId} className="flex justify-between py-2 gap-2">
                <span className="font-body font-light text-[11px] text-offwhite/60 truncate">{item.name} × {item.quantity}</span>
                <span className="font-data text-[11px] text-offwhite/70 shrink-0">{fmt(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-body font-light text-offwhite/50"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            {shippingCost > 0 && <div className="flex justify-between font-body font-light text-offwhite/50"><span>Frete</span><span>{fmt(shippingCost)}</span></div>}
            {discountAmount > 0 && <div className="flex justify-between font-body font-light text-sage-light"><span>Desconto</span><span>− {fmt(discountAmount)}</span></div>}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-offwhite/[0.08]">
            <span className="font-body font-light text-[10px] tracking-[0.15em] uppercase text-offwhite/40">Total</span>
            <span className="font-data italic text-xl text-gold">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

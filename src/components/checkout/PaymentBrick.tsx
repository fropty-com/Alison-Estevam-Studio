'use client'

import { useEffect, useRef, useState } from 'react'

const SDK_URL = 'https://sdk.mercadopago.com/js/v2'
const CONTAINER_ID = 'mp-payment-brick-container'

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => {
      bricks: () => {
        create: (type: string, containerId: string, settings: Record<string, unknown>) => Promise<{ unmount: () => void }>
      }
    }
  }
}

function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SDK_URL}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o SDK de pagamento.')))
      return
    }
    const script = document.createElement('script')
    script.src = SDK_URL
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar o SDK de pagamento.'))
    document.body.appendChild(script)
  })
}

export interface PaymentBrickSubmitResult {
  status: 'approved' | 'pending' | 'rejected'
  referenceCode: string
  qrCode: string | null
  qrCodeBase64: string | null
}

export function PaymentBrick({
  publicKey,
  orderId,
  amount,
  payerEmail,
  onResult,
  onError,
}: {
  publicKey: string
  orderId: string
  amount: number
  payerEmail: string
  onResult: (result: PaymentBrickSubmitResult) => void
  onError: (message: string) => void
}) {
  const brickRef = useRef<{ unmount: () => void } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    loadSdk()
      .then(() => {
        if (cancelled || !window.MercadoPago) return
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
        return mp.bricks().create('payment', CONTAINER_ID, {
          initialization: {
            amount,
            payer: { email: payerEmail || undefined },
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              bankTransfer: 'all',
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => { if (!cancelled) setLoading(false) },
            onError: (error: unknown) => {
              console.error('Payment Brick error:', error)
              onError('Erro no formulário de pagamento. Recarregue a página e tente novamente.')
            },
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) => {
              return fetch('/api/checkout/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, ...formData }),
              })
                .then(res => res.json())
                .then(data => {
                  if (data.error) {
                    onError(data.error)
                    return
                  }
                  onResult(data)
                })
                .catch(() => {
                  onError('Erro ao processar pagamento. Tente novamente.')
                })
            },
          },
        })
      })
      .then(brick => {
        if (brick) brickRef.current = brick
      })
      .catch(err => {
        console.error(err)
        onError('Não foi possível carregar o formulário de pagamento.')
      })

    return () => {
      cancelled = true
      brickRef.current?.unmount()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, amount])

  return (
    <div>
      {loading && (
        <p className="font-body font-light text-[11px] text-offwhite/55 italic text-center py-6">
          Carregando formulário de pagamento…
        </p>
      )}
      <div id={CONTAINER_ID} />
    </div>
  )
}

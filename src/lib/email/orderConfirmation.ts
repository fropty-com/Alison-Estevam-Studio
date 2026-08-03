import { Resend } from 'resend'
import { BRAND } from '@/config/brand'
import { emailLayout, emailHeader, emailBody, emailText, emailDetailsBlock, emailFooter } from './components'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function sendOrderConfirmationEmail(params: {
  clientName: string
  clientEmail: string
  referenceCode: string
  items: { name: string; quantity: number; unitPrice: number }[]
  subtotal: number
  shippingCost: number
  discountAmount: number
  total: number
  fulfillmentMethod: 'envio' | 'retirada'
}) {
  const { clientName, clientEmail, referenceCode, items, subtotal, shippingCost, discountAmount, total, fulfillmentMethod } = params

  const rows: [string, string][] = items.map(item => [
    `${item.name} × ${item.quantity}`,
    fmt(item.unitPrice * item.quantity),
  ])
  rows.push(['Subtotal', fmt(subtotal)])
  if (shippingCost > 0) rows.push(['Frete', fmt(shippingCost)])
  if (discountAmount > 0) rows.push(['Desconto', `− ${fmt(discountAmount)}`])
  rows.push(['Total', fmt(total)])
  rows.push(['Entrega', fulfillmentMethod === 'retirada' ? 'Retirada na loja' : 'Envio'])
  rows.push(['Código', referenceCode])

  const html = emailLayout({
    title: 'Pedido Confirmado',
    body: [
      emailHeader('ALISON ESTEVAM STUDIO', 'Pagamento confirmado.'),
      emailBody([
        emailText(`Olá, ${clientName}. Seu pagamento foi confirmado e o pedido já está sendo preparado.`),
        emailDetailsBlock('SEU PEDIDO', rows),
      ].join('')),
      emailFooter(),
    ].join(''),
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: `${BRAND.fullName} <${BRAND.emailFrom}>`,
      to: clientEmail,
      subject: `Pedido confirmado — ${referenceCode}`,
      html,
    })
    if (error) console.error('Failed to send order confirmation email:', error)
  } catch (err) {
    console.error('Failed to send order confirmation email:', err)
  }
}

import { Resend } from 'resend'
import { BRAND } from '@/config/brand'
import { emailLayout, emailHeader, emailBody, emailText, emailDetailsBlock, emailButton, emailFooter } from './components'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function sendNewOrderAdminEmail(params: {
  ownerEmails: string[]
  referenceCode: string
  clientName: string
  items: { name: string; quantity: number; unitPrice: number }[]
  total: number
  fulfillmentMethod: 'envio' | 'retirada'
}) {
  const { ownerEmails, referenceCode, clientName, items, total, fulfillmentMethod } = params
  if (ownerEmails.length === 0) return

  const rows: [string, string][] = items.map(item => [
    `${item.name} × ${item.quantity}`,
    fmt(item.unitPrice * item.quantity),
  ])
  rows.push(['Cliente', clientName])
  rows.push(['Total', fmt(total)])
  rows.push(['Entrega', fulfillmentMethod === 'retirada' ? 'Retirada na loja' : 'Envio'])
  rows.push(['Código', referenceCode])

  const html = emailLayout({
    title: 'Novo pedido de produto',
    body: [
      emailHeader('LOJA · NOVO PEDIDO', `Pedido ${referenceCode}`),
      emailBody([
        emailText(`${clientName} acabou de pagar um pedido na loja de produtos.`),
        emailDetailsBlock('DETALHES DO PEDIDO', rows),
        emailButton('https://alisonestevam.com.br/admin/produtos', 'Ver no painel', 'primary'),
      ].join('')),
      emailFooter(),
    ].join(''),
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: `${BRAND.fullName} <${BRAND.emailFrom}>`,
      to: ownerEmails,
      subject: `Novo pedido — ${referenceCode}`,
      html,
    })
    if (error) console.error('Failed to send new-order admin email:', error)
  } catch (err) {
    console.error('Failed to send new-order admin email:', err)
  }
}

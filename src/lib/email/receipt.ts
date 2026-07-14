import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BRAND } from '@/config/brand'

const METHOD_LABEL: Record<string, string> = {
  cash: 'Dinheiro',
  pix: 'Pix',
  debit_card: 'Cartão de Débito',
  credit_card: 'Cartão de Crédito',
  courtesy: 'Cortesia',
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function sendReceiptEmail(params: {
  toEmail: string
  clientName: string
  clientWhatsapp: string
  receiptNumber: number
  paymentId: string
  serviceName: string
  serviceDate: string
  serviceTime: string
  subtotal: number
  discount: number
  fee: number
  total: number
  method: string
  paidAt: string
}) {
  const {
    toEmail, clientName, clientWhatsapp, receiptNumber, paymentId,
    serviceName, serviceDate, serviceTime, subtotal, discount, fee, total, method, paidAt,
  } = params

  const serviceDateLabel = serviceDate ? format(parseISO(serviceDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''
  const paidAtDate = parseISO(paidAt)
  const paidDateLabel = format(paidAtDate, "d 'de' MMM. 'de' yyyy", { locale: ptBR })
  const paidTimeLabel = format(paidAtDate, 'HH:mm')

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo</title>
</head>
<body style="margin:0;padding:0;background:#1C1C1A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1C1A;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1C1C1A;border:1px solid rgba(245,240,232,0.07);">

          <tr>
            <td style="padding:36px 36px 24px;border-bottom:1px solid rgba(245,240,232,0.07);">
              <p style="margin:0 0 4px;font-size:8.5px;letter-spacing:0.4em;text-transform:uppercase;color:rgba(245,240,232,0.28);">
                Recibo Nº ${receiptNumber}
              </p>
              <h1 style="margin:0;font-size:24px;font-weight:300;color:#F5F0E8;letter-spacing:0.02em;">
                ${BRAND.fullName}
              </h1>
              <p style="margin:6px 0 0;font-size:11px;color:rgba(245,240,232,0.4);">
                ${BRAND.address.street}, ${BRAND.address.neighborhood} — ${BRAND.address.city}/${BRAND.address.state}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 36px 8px;">
              <p style="margin:0 0 2px;font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#7A9182;">Pago</p>
              <p style="margin:0;font-size:12px;color:rgba(245,240,232,0.45);">${paidDateLabel} às ${paidTimeLabel}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 36px;">
              <p style="margin:0 0 2px;font-size:12px;color:rgba(245,240,232,0.75);">${clientName}</p>
              <p style="margin:0;font-size:11px;color:rgba(245,240,232,0.35);">${clientWhatsapp}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 36px;border-top:1px solid rgba(245,240,232,0.07);">
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding-bottom:4px;font-size:13px;color:rgba(245,240,232,0.8);">${serviceName}</td>
                  <td align="right" style="padding-bottom:4px;font-size:13px;color:rgba(245,240,232,0.8);">${fmt(subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-bottom:16px;font-size:10.5px;color:rgba(245,240,232,0.3);">${serviceDateLabel}${serviceTime ? ` às ${serviceTime}` : ''}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 36px 20px;border-top:1px solid rgba(245,240,232,0.07);">
              ${row('Subtotal', fmt(subtotal))}
              ${row('Desconto', `- ${fmt(discount)}`)}
              ${fee > 0 ? row('Taxa', fmt(fee)) : ''}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(245,240,232,0.1);">
                <tr>
                  <td style="font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,240,232,0.4);">Total</td>
                  <td align="right" style="font-size:20px;color:#D9B761;">${fmt(total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 36px 32px;border-top:1px solid rgba(245,240,232,0.07);">
              <p style="margin:0;font-size:10.5px;color:rgba(245,240,232,0.3);">
                Pago · ${METHOD_LABEL[method] ?? method} · ${paidTimeLabel}, ${paidDateLabel}
              </p>
              <p style="margin:8px 0 0;font-size:9px;color:rgba(245,240,232,0.18);">ID ${paymentId.slice(0, 8)}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: `${BRAND.fullName} <agendamento@alisonestevam.com.br>`,
      to: toEmail,
      subject: `Recibo Nº ${receiptNumber} — ${BRAND.fullName}`,
      html,
    })
    // The Resend SDK returns { error } instead of throwing for API-level
    // failures — without this check those failures were silently swallowed.
    if (error) console.error('Failed to send receipt email:', error)
  } catch (err) {
    console.error('Failed to send receipt email:', err)
  }
}

function row(label: string, value: string): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
      <tr>
        <td style="font-size:11px;color:rgba(245,240,232,0.4);">${label}</td>
        <td align="right" style="font-size:11px;color:rgba(245,240,232,0.6);">${value}</td>
      </tr>
    </table>`
}

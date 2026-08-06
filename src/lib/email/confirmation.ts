import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BRAND } from '@/config/brand'
import { emailLayout, emailHeader, emailBody, emailText, emailDetailsBlock, emailButton, emailButtonRow, emailFooter } from './components'

export async function sendConfirmationEmail(params: {
  clientName:    string
  clientEmail:   string
  serviceName:   string
  date:          string
  startTime:     string
  referenceCode: string
}) {
  const { clientName, clientEmail, serviceName, date, startTime, referenceCode } = params
  const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  const html = emailLayout({
    title: 'Agendamento Confirmado',
    body: [
      emailHeader('ALISON ESTEVAM STUDIO', 'Agendamento confirmado.'),
      emailBody([
        emailText(`Olá, ${clientName}. Seu agendamento foi recebido. Toque no botão abaixo para confirmar sua presença.`),
        emailDetailsBlock('DETALHES', [
          ['Serviço', serviceName],
          ['Data', formattedDate],
          ['Horário', startTime.replace(':', 'h')],
          ['Código', referenceCode],
        ]),
        emailButton(`${BRAND.siteUrl}/confirmar/${referenceCode}`, 'Confirmar presença', 'primary'),
        emailButtonRow([
          { href: `https://wa.me/${BRAND.whatsapp}`, label: 'Falar no WhatsApp', variant: 'secondary' },
          { href: `${BRAND.siteUrl}/reagendar/${referenceCode}`, label: 'Reagendar', variant: 'outline' },
          { href: `${BRAND.siteUrl}/cancelar/${referenceCode}`, label: 'Cancelar', variant: 'destructive' },
        ]),
      ].join('')),
      emailFooter(),
    ].join(''),
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from:    `${BRAND.fullName} <${BRAND.emailFrom}>`,
      to:      clientEmail,
      subject: `Agendamento recebido — ${referenceCode}`,
      html,
    })
    // The Resend SDK returns { error } instead of throwing for API-level
    // failures (unverified domain, bad key, invalid recipient) — without
    // this check those failures were silently swallowed as "sent".
    if (error) console.error('Failed to send confirmation email:', error)
  } catch (err) {
    // Email is non-critical — log and continue
    console.error('Failed to send confirmation email:', err)
  }
}

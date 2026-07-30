import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BRAND } from '@/config/brand'
import { emailLayout, emailHeader, emailBody, emailText, emailDetailsBlock, emailButton, emailButtonRow, emailFooter } from './components'

export async function sendReminderEmail(params: {
  clientName:    string
  clientEmail:   string
  serviceName:   string
  date:          string
  startTime:     string
  referenceCode: string
}) {
  const { clientName, clientEmail, serviceName, date, startTime, referenceCode } = params
  const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })

  const html = emailLayout({
    title: 'Lembrete de agendamento',
    body: [
      emailHeader('ALISON ESTEVAM STUDIO', 'Seu horário é amanhã.'),
      emailBody([
        emailText(`Oi, ${clientName}! Passando para lembrar do seu horário amanhã, ${formattedDate}.`),
        emailDetailsBlock('DETALHES', [
          ['Serviço', serviceName],
          ['Data', formattedDate],
          ['Horário', startTime.replace(':', 'h')],
          ['Código', referenceCode],
        ]),
        emailButtonRow([
          { href: `https://wa.me/${BRAND.whatsapp}`, label: 'Falar no WhatsApp', variant: 'secondary' },
          { href: `${BRAND.siteUrl}/reagendar/${referenceCode}`, label: 'Reagendar', variant: 'ghost' },
          { href: `${BRAND.siteUrl}/cancelar/${referenceCode}`, label: 'Cancelar', variant: 'ghost' },
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
      subject: `Lembrete: seu horário é amanhã — ${referenceCode}`,
      html,
    })
    if (error) console.error('Failed to send reminder email:', error)
  } catch (err) {
    console.error('Failed to send reminder email:', err)
  }
}

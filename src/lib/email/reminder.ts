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
  /** 'tomorrow' (default, sent ~24h before) or 'soon' (sent ~2h before, same-day copy). */
  timing?: 'tomorrow' | 'soon'
}) {
  const { clientName, clientEmail, serviceName, date, startTime, referenceCode, timing = 'tomorrow' } = params
  const formattedDate = format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })
  const timeLabel = startTime.replace(':', 'h')

  const isSoon = timing === 'soon'
  const preheader = isSoon ? `Seu horário é daqui a pouco, às ${timeLabel}.` : 'Seu horário é amanhã.'
  const bodyText = isSoon
    ? `Oi, ${clientName}! Passando para lembrar que seu horário é hoje, às ${timeLabel}.`
    : `Oi, ${clientName}! Passando para lembrar do seu horário amanhã, ${formattedDate}.`
  const subject = isSoon
    ? `Lembrete: seu horário é daqui a pouco — ${referenceCode}`
    : `Lembrete: seu horário é amanhã — ${referenceCode}`

  const html = emailLayout({
    title: 'Lembrete de agendamento',
    body: [
      emailHeader('ALISON ESTEVAM STUDIO', preheader),
      emailBody([
        emailText(bodyText),
        emailDetailsBlock('DETALHES', [
          ['Serviço', serviceName],
          ['Data', formattedDate],
          ['Horário', timeLabel],
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
      subject,
      html,
    })
    if (error) console.error('Failed to send reminder email:', error)
  } catch (err) {
    console.error('Failed to send reminder email:', err)
  }
}

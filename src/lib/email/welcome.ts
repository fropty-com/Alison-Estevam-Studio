import { Resend } from 'resend'
import { BRAND, BRAND_COLORS } from '@/config/brand'
import { emailLayout, emailHeader, emailDivider, emailBody, emailDetailsBlock, emailButton, emailFooter } from './components'

export async function sendWelcomeEmail(params: {
  clientName:  string
  clientEmail: string
  confirmUrl?: string
}) {
  const { clientName, clientEmail, confirmUrl } = params

  const html = buildWelcomeHtml({ clientName, confirmUrl })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from:    `${BRAND.fullName} <${BRAND.emailFrom}>`,
      to:      clientEmail,
      subject: `Bem-vindo ao ${BRAND.fullName}`,
      html,
    })
    // The Resend SDK returns { error } instead of throwing for API-level
    // failures — without this check those failures were silently swallowed.
    if (error) console.error('Failed to send welcome email:', error)
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }
}

export function buildWelcomeHtml(params: { clientName: string; confirmUrl?: string }): string {
  const { clientName, confirmUrl } = params
  const C = BRAND_COLORS

  return emailLayout({
    title: `Bem-vindo ao ${BRAND.fullName}`,
    body: [
      emailHeader(BRAND.fullName.toUpperCase(), `Bem-vindo, ${clientName}.`),
      emailDivider(C.gold),
      emailBody([
        `<p style="margin:0 0 20px;font-size:14px;font-weight:300;color:rgba(245,240,232,0.55);line-height:1.9;">
          Seu cadastro no <strong style="color:${C.offwhite};font-weight:400;">${BRAND.fullName}</strong> foi criado com sucesso.
          Aqui você poderá agendar horários, acompanhar seu histórico e gerenciar sua conta.
        </p>`,
        emailDetailsBlock('O QUE VOCÊ PODE FAZER', [
          ['Agendamento', 'Reserve seu horário diretamente pelo site'],
          ['Histórico', 'Acesse todos os seus atendimentos anteriores'],
          ['Cancelamento', 'Cancele ou reagende com facilidade'],
        ]),
        confirmUrl
          ? emailButton(confirmUrl, 'Confirmar e-mail →', 'primary') + `<p style="margin:12px 0 0;font-size:9px;letter-spacing:0.15em;color:rgba(245,240,232,0.18);">O link expira em 24 horas.</p>`
          : emailButton(BRAND.siteUrl, 'Agendar horário →', 'primary'),
      ].join('')),
      emailFooter('Se não foi você quem criou esta conta, ignore este e-mail.'),
    ].join(''),
  })
}

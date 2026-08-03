import { Resend } from 'resend'
import { BRAND } from '@/config/brand'
import { emailLayout, emailHeader, emailBody, emailText, emailButton, emailFooter } from './components'

export async function sendReviewRequestEmail(params: {
  clientName:  string
  clientEmail: string
  serviceName: string
}) {
  const { clientName, clientEmail, serviceName } = params

  const html = emailLayout({
    title: 'Como foi seu atendimento?',
    body: [
      emailHeader('ALISON ESTEVAM STUDIO', 'Obrigado pela visita!'),
      emailBody([
        emailText(`Olá, ${clientName}. Obrigado por vir! Esperamos que tenha gostado do seu ${serviceName}.`),
        emailText('Se puder, deixe uma avaliação rápida — isso nos ajuda muito.'),
        emailButton(`${BRAND.siteUrl}/perfil/avaliacoes`, 'Avaliar atendimento', 'primary'),
      ].join('')),
      emailFooter(),
    ].join(''),
  })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from:    `${BRAND.fullName} <${BRAND.emailFrom}>`,
      to:      clientEmail,
      subject: 'Como foi seu atendimento?',
      html,
    })
    if (error) console.error('Failed to send review request email:', error)
  } catch (err) {
    console.error('Failed to send review request email:', err)
  }
}

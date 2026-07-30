import { Resend } from 'resend'
import { BRAND, BRAND_COLORS } from '@/config/brand'
import { emailLayout, emailHeader, emailDivider, emailBody, emailButton, emailAlertBlock, emailFooter } from './components'

export async function sendPasswordResetEmail(params: {
  clientName:  string
  clientEmail: string
  resetUrl:    string
}) {
  const { clientName, clientEmail, resetUrl } = params

  const html = buildPasswordResetHtml({ clientName, resetUrl })

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from:    `${BRAND.fullName} <${BRAND.emailFrom}>`,
      to:      clientEmail,
      subject: 'Redefinição de senha',
      html,
    })
    // The Resend SDK returns { error } instead of throwing for API-level
    // failures — without this check those failures were silently swallowed.
    if (error) console.error('Failed to send password reset email:', error)
  } catch (err) {
    console.error('Failed to send password reset email:', err)
  }
}

export function buildPasswordResetHtml(params: { clientName: string; resetUrl: string }): string {
  const { clientName, resetUrl } = params
  const C = BRAND_COLORS

  return emailLayout({
    title: 'Redefinição de senha',
    body: [
      emailHeader(BRAND.fullName.toUpperCase(), 'Redefinição de senha.'),
      emailDivider(),
      emailBody([
        `<p style="margin:0 0 24px;font-size:14px;font-weight:300;color:rgba(245,240,232,0.55);line-height:1.9;">
          Olá, ${clientName}. Recebemos uma solicitação para redefinir a senha da sua conta no
          <strong style="color:${C.offwhite};font-weight:400;">${BRAND.fullName}</strong>.
        </p>`,
        emailButton(resetUrl, 'Redefinir senha →', 'light'),
        emailAlertBlock('ATENÇÃO', `Este link é válido por <strong style="color:rgba(245,240,232,0.55);font-weight:400;">1 hora</strong> e pode ser usado apenas uma vez. Após esse período, será necessário solicitar um novo link.`),
        `<p style="margin:22px 0 0;font-size:12px;font-weight:300;color:rgba(245,240,232,0.30);line-height:1.75;">
          Se você não solicitou a redefinição de senha, ignore este e-mail.
          Sua senha permanecerá a mesma e nenhuma alteração será feita.
        </p>`,
      ].join('')),
      `<tr>
        <td style="padding:0 40px 28px;">
          <p style="margin:0 0 4px;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,240,232,0.15);">
            Caso o botão não funcione, copie o link abaixo:
          </p>
          <p style="margin:0;font-size:9px;color:rgba(245,240,232,0.22);word-break:break-all;line-height:1.6;">
            ${resetUrl}
          </p>
        </td>
      </tr>`,
      emailFooter(),
    ].join(''),
  })
}

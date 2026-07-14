import { Resend } from 'resend'
import { BRAND, BRAND_COLORS } from '@/config/brand'

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
      from:    `${BRAND.fullName} <noreply@alisonestevam.com.br>`,
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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinição de senha</title>
</head>
<body style="margin:0;padding:0;background:${C.charcoal};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.charcoal};">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.charcoal};border:1px solid rgba(245,240,232,0.07);">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 32px;border-bottom:1px solid rgba(245,240,232,0.07);">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.45em;text-transform:uppercase;color:rgba(245,240,232,0.28);">
                ${BRAND.fullName.toUpperCase()}
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:300;color:${C.offwhite};letter-spacing:0.04em;line-height:1.2;">
                Redefinição de senha.
              </h1>
            </td>
          </tr>

          <!-- Ornament line -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:2px;background:linear-gradient(to right,rgba(245,240,232,0.25),transparent);width:48px;margin-top:28px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <p style="margin:0 0 24px;font-size:14px;font-weight:300;color:rgba(245,240,232,0.55);line-height:1.9;">
                Olá, ${clientName}. Recebemos uma solicitação para redefinir a senha da sua conta no
                <strong style="color:${C.offwhite};font-weight:400;">${BRAND.fullName}</strong>.
              </p>

              <!-- CTA principal -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:${C.offwhite};">
                    <a href="${resetUrl}" style="display:inline-block;padding:15px 36px;font-size:9px;letter-spacing:0.38em;text-transform:uppercase;color:${C.charcoalDeep};text-decoration:none;font-weight:300;">
                      Redefinir senha →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,240,232,0.02);border:1px solid rgba(245,240,232,0.07);">
                <tr>
                  <td style="padding:18px 24px;">
                    <p style="margin:0 0 6px;font-size:8.5px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(245,240,232,0.22);">ATENÇÃO</p>
                    <p style="margin:0;font-size:12px;font-weight:300;color:rgba(245,240,232,0.38);line-height:1.75;">
                      Este link é válido por <strong style="color:rgba(245,240,232,0.55);font-weight:400;">1 hora</strong> e pode ser usado apenas uma vez.
                      Após esse período, será necessário solicitar um novo link.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:22px 0 0;font-size:12px;font-weight:300;color:rgba(245,240,232,0.30);line-height:1.75;">
                Se você não solicitou a redefinição de senha, ignore este e-mail.
                Sua senha permanecerá a mesma e nenhuma alteração será feita.
              </p>
            </td>
          </tr>

          <!-- URL fallback -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0 0 4px;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(245,240,232,0.15);">
                Caso o botão não funcione, copie o link abaixo:
              </p>
              <p style="margin:0;font-size:9px;color:rgba(245,240,232,0.22);word-break:break-all;line-height:1.6;">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px;border-top:1px solid rgba(245,240,232,0.06);">
              <p style="margin:0;font-size:9px;letter-spacing:0.2em;color:rgba(245,240,232,0.18);">
                ${BRAND.fullName} · Atendimento exclusivo, um cliente por vez.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

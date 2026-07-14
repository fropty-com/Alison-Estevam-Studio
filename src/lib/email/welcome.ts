import { Resend } from 'resend'
import { BRAND, BRAND_COLORS } from '@/config/brand'

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
      from:    `${BRAND.fullName} <noreply@alisonestevam.com.br>`,
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

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao ${BRAND.fullName}</title>
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
                Bem-vindo, ${clientName}.
              </h1>
            </td>
          </tr>

          <!-- Ornament line -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:2px;background:linear-gradient(to right,${C.gold},transparent);width:48px;margin-top:28px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 40px 32px;">
              <p style="margin:0 0 20px;font-size:14px;font-weight:300;color:rgba(245,240,232,0.55);line-height:1.9;">
                Seu cadastro no <strong style="color:${C.offwhite};font-weight:400;">${BRAND.fullName}</strong> foi criado com sucesso.
                Aqui você poderá agendar horários, acompanhar seu histórico e gerenciar sua conta.
              </p>

              <!-- Info block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,240,232,0.02);border:1px solid rgba(245,240,232,0.07);margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px 8px;">
                    <p style="margin:0 0 12px;font-size:8.5px;letter-spacing:0.38em;text-transform:uppercase;color:rgba(201,169,110,0.65);">O QUE VOCÊ PODE FAZER</p>
                  </td>
                </tr>
                ${infoRow('Agendamento', 'Reserve seu horário diretamente pelo site')}
                ${infoRow('Histórico',   'Acesse todos os seus atendimentos anteriores')}
                ${infoRow('Cancelamento','Cancele ou reagende com facilidade')}
                <tr><td style="padding:4px 24px 20px;"></td></tr>
              </table>

              ${confirmUrl ? `
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${C.gold};">
                    <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;font-size:9px;letter-spacing:0.38em;text-transform:uppercase;color:${C.charcoalDeep};text-decoration:none;font-weight:300;">
                      Confirmar e-mail →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:9px;letter-spacing:0.15em;color:rgba(245,240,232,0.18);">
                O link expira em 24 horas.
              </p>` : `
              <!-- CTA sem confirmação -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${C.gold};">
                    <a href="${BRAND.siteUrl}" style="display:inline-block;padding:14px 32px;font-size:9px;letter-spacing:0.38em;text-transform:uppercase;color:${C.charcoalDeep};text-decoration:none;font-weight:300;">
                      Agendar horário →
                    </a>
                  </td>
                </tr>
              </table>`}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px;border-top:1px solid rgba(245,240,232,0.06);">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;color:rgba(245,240,232,0.18);">
                ${BRAND.fullName} · Atendimento exclusivo, um cliente por vez.
              </p>
              <p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(245,240,232,0.10);">
                Se não foi você quem criou esta conta, ignore este e-mail.
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

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:5px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:100px;font-size:8px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,240,232,0.25);vertical-align:top;padding-top:2px;">${label}</td>
            <td style="font-size:12px;color:rgba(245,240,232,0.60);font-weight:300;line-height:1.6;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`
}

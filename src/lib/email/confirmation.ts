import { Resend } from 'resend'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BRAND } from '@/config/brand'

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

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agendamento Confirmado</title>
</head>
<body style="margin:0;padding:0;background:#1C1C1A;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C1C1A;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#1C1C1A;border:1px solid rgba(245,240,232,0.07);">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 32px;border-bottom:1px solid rgba(245,240,232,0.07);">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.45em;text-transform:uppercase;color:rgba(245,240,232,0.28);">
                ALISON ESTEVAM STUDIO
              </p>
              <h1 style="margin:0;font-size:28px;font-weight:300;color:#F5F0E8;letter-spacing:0.04em;line-height:1.2;">
                Agendamento confirmado.
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 28px;font-size:13px;font-weight:300;color:rgba(245,240,232,0.55);line-height:1.85;">
                Olá, ${clientName}. Seu agendamento foi recebido e está pendente de confirmação via WhatsApp.
              </p>

              <!-- Details block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,240,232,0.03);border:1px solid rgba(245,240,232,0.07);margin-bottom:28px;">
                <tr><td style="padding:24px 24px 8px;">
                  <p style="margin:0 0 14px;font-size:8.5px;letter-spacing:0.38em;text-transform:uppercase;color:rgba(122,145,130,0.65);">DETALHES</p>
                </td></tr>
                ${row('Serviço',  serviceName)}
                ${row('Data',     formattedDate)}
                ${row('Horário',  startTime.replace(':', 'h'))}
                ${row('Código',   referenceCode)}
                <tr><td style="padding:8px 24px 24px;"></td></tr>
              </table>

              <!-- CTAs -->
              <table cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 0;">
                <tr>
                  <td style="background:#7A9182;">
                    <a href="https://wa.me/${BRAND.whatsapp}" style="display:inline-block;padding:14px 28px;font-size:9px;letter-spacing:0.38em;text-transform:uppercase;color:#141412;text-decoration:none;font-weight:300;">
                      Confirmar no WhatsApp →
                    </a>
                  </td>
                  <td style="background:rgba(245,240,232,0.05);border:1px solid rgba(245,240,232,0.10);">
                    <a href="${BRAND.siteUrl}/reagendar/${referenceCode}" style="display:inline-block;padding:14px 20px;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(245,240,232,0.45);text-decoration:none;font-weight:300;">
                      Reagendar
                    </a>
                  </td>
                  <td style="background:rgba(245,240,232,0.03);border:1px solid rgba(245,240,232,0.07);">
                    <a href="${BRAND.siteUrl}/cancelar/${referenceCode}" style="display:inline-block;padding:14px 20px;font-size:9px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(245,240,232,0.28);text-decoration:none;font-weight:300;">
                      Cancelar
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(245,240,232,0.06);">
              <p style="margin:0;font-size:9px;letter-spacing:0.2em;color:rgba(245,240,232,0.2);">
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

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from:    `${BRAND.fullName} <agendamento@alisonestevam.com.br>`,
      to:      clientEmail,
      subject: `Agendamento recebido — ${referenceCode}`,
      html,
    })
  } catch (err) {
    // Email is non-critical — log and continue
    console.error('Failed to send confirmation email:', err)
  }
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:6px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:90px;font-size:8px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,240,232,0.28);vertical-align:top;padding-top:2px;">${label}</td>
            <td style="font-size:13px;color:rgba(245,240,232,0.75);font-weight:300;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`
}

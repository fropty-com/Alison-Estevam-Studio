import { BRAND, BRAND_COLORS } from '@/config/brand'

/**
 * Shared building blocks for every transactional e-mail. All 4 pre-existing
 * templates (confirmation, receipt, welcome, password-reset) had their own
 * copies of the same header/footer/row markup with slightly different
 * hardcoded hex values instead of BRAND_COLORS — this consolidates them so
 * a palette change only needs to happen in one place, and every new
 * template (reminder, etc.) starts from the same visual language.
 */
const C = BRAND_COLORS

export function emailLayout(params: { title: string; maxWidth?: number; body: string }): string {
  const { title, maxWidth = 520, body } = params
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.charcoal};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.charcoal};">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:${maxWidth}px;background:${C.charcoal};border:1px solid rgba(245,240,232,0.07);">
          ${body}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailHeader(eyebrow: string, title: string): string {
  return `
  <tr>
    <td style="padding:40px 40px 32px;border-bottom:1px solid rgba(245,240,232,0.07);">
      <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.45em;text-transform:uppercase;color:rgba(245,240,232,0.28);">
        ${eyebrow}
      </p>
      <h1 style="margin:0;font-size:28px;font-weight:300;color:${C.offwhite};letter-spacing:0.04em;line-height:1.2;">
        ${title}
      </h1>
    </td>
  </tr>`
}

export function emailDivider(color = 'rgba(245,240,232,0.25)'): string {
  return `
  <tr>
    <td style="padding:0 40px;">
      <div style="height:2px;background:linear-gradient(to right,${color},transparent);width:48px;margin-top:28px;"></div>
    </td>
  </tr>`
}

export function emailBody(html: string): string {
  return `
  <tr>
    <td style="padding:32px 40px;">
      ${html}
    </td>
  </tr>`
}

export function emailText(html: string): string {
  return `<p style="margin:0 0 24px;font-size:13px;font-weight:300;color:rgba(245,240,232,0.55);line-height:1.85;">${html}</p>`
}

export function emailDetailsBlock(title: string, rows: [string, string][]): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,240,232,0.03);border:1px solid rgba(245,240,232,0.07);margin-bottom:28px;">
    <tr><td style="padding:24px 24px 8px;">
      <p style="margin:0 0 14px;font-size:8.5px;letter-spacing:0.38em;text-transform:uppercase;color:rgba(122,145,130,0.65);">${title}</p>
    </td></tr>
    ${rows.map(([label, value]) => `
    <tr>
      <td style="padding:6px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:100px;font-size:8px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(245,240,232,0.28);vertical-align:top;padding-top:2px;">${label}</td>
            <td style="font-size:13px;color:rgba(245,240,232,0.75);font-weight:300;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>`).join('')}
    <tr><td style="padding:8px 24px 24px;"></td></tr>
  </table>`
}

export function emailAlertBlock(eyebrow: string, message: string): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,240,232,0.02);border:1px solid rgba(245,240,232,0.07);margin-bottom:24px;">
    <tr>
      <td style="padding:18px 24px;">
        <p style="margin:0 0 6px;font-size:8.5px;letter-spacing:0.35em;text-transform:uppercase;color:rgba(245,240,232,0.22);">${eyebrow}</p>
        <p style="margin:0;font-size:12px;font-weight:300;color:rgba(245,240,232,0.38);line-height:1.75;">${message}</p>
      </td>
    </tr>
  </table>`
}

type ButtonVariant = 'primary' | 'secondary' | 'light' | 'outline' | 'destructive' | 'ghost'

// Mirrors the real Button.tsx variants used across the site (border/fill and
// destructive red in particular) so links like "Reagendar"/"Cancelar" read
// the same in an e-mail as they do in the client portal's own appointment
// card (src/app/conta/page.tsx) — a bordered outline button next to a solid
// bg-error one, not two identically-dim "ghost" links.
const BUTTON_STYLE: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary:     { bg: C.gold, fg: C.charcoalDeep },
  secondary:   { bg: C.sage, fg: C.charcoalDeep },
  light:       { bg: C.offwhite, fg: C.charcoalDeep },
  outline:     { bg: C.charcoal, fg: 'rgba(245,240,232,0.55)', border: '1px solid rgba(245,240,232,0.15)' },
  destructive: { bg: C.error, fg: C.offwhite },
  ghost:       { bg: 'rgba(245,240,232,0.05)', fg: 'rgba(245,240,232,0.45)' },
}

export function emailButton(href: string, label: string, variant: ButtonVariant = 'primary'): string {
  const { bg, fg, border } = BUTTON_STYLE[variant]
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
    <tr>
      <td align="center" style="background:${bg};${border ? `border:${border};` : ''}">
        <a href="${href}" style="display:block;padding:16px 28px;font-size:9.5px;letter-spacing:0.38em;text-transform:uppercase;color:${fg};text-decoration:none;font-weight:500;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

export function emailButtonRow(buttons: { href: string; label: string; variant?: ButtonVariant }[]): string {
  return `
  <table cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 0;">
    <tr>
      ${buttons.map(({ href, label, variant = 'ghost' }) => {
        const { bg, fg, border } = BUTTON_STYLE[variant]
        return `
      <td style="background:${bg};${border ? `border:${border};` : ''}">
        <a href="${href}" style="display:inline-block;padding:${border ? '11px 19px' : '12px 20px'};font-size:8.5px;letter-spacing:0.32em;text-transform:uppercase;color:${fg};text-decoration:none;font-weight:300;">
          ${label}
        </a>
      </td>`
      }).join('')}
    </tr>
  </table>`
}

export function emailFooter(note?: string): string {
  return `
  <tr>
    <td style="padding:22px 40px;border-top:1px solid rgba(245,240,232,0.06);">
      <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.2em;color:rgba(245,240,232,0.18);">
        ${BRAND.fullName} · Atendimento exclusivo, um cliente por vez.
      </p>
      ${note ? `<p style="margin:0;font-size:9px;letter-spacing:0.15em;color:rgba(245,240,232,0.10);">${note}</p>` : ''}
    </td>
  </tr>`
}

export { C as EMAIL_COLORS }

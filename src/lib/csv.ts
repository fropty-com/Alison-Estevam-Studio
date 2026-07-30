/** Builds an RFC-4180-ish CSV string (semicolon-delimited, BOM-prefixed for
 * Excel's default locale-aware CSV import) from a header row and data rows. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const s = String(value ?? '')
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers, ...rows].map(row => row.map(escape).join(';'))
  return '﻿' + lines.join('\r\n')
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

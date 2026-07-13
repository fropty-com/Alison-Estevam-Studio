import { BRAND } from '@/config/brand'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toIcsDate(d: Date) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

// Commas, semicolons and newlines are structural in ICS text values and must
// be escaped or they silently truncate the field in some calendar apps.
function escapeIcsText(s: string) {
  return s.replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n')
}

/**
 * Builds a data: URL for a single-event .ics file, downloadable straight
 * from a link with no backend endpoint — works with Apple Calendar, Google
 * Calendar and Outlook on both iOS and Android.
 */
export function buildIcsDataUrl({
  title,
  date,
  startTime,
  durationMinutes,
}: {
  title: string
  date: string        // yyyy-MM-dd
  startTime: string    // HH:mm
  durationMinutes: number
}) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = startTime.split(':').map(Number)
  const start = new Date(year, month - 1, day, hour, minute)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const address = `${BRAND.address.street}, ${BRAND.address.neighborhood}, ${BRAND.address.city}/${BRAND.address.state}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Alison Estevam Studio//Agendamento//PT',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${start.getTime()}-${Math.random().toString(36).slice(2)}@alisonestevam.studio`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `LOCATION:${escapeIcsText(address)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`
}

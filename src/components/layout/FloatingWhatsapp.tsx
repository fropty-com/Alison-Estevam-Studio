'use client'

import { BRAND } from '@/config/brand'

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01-1.87-1.87-4.36-2.91-7.02-2.91zm0 0" />
    </svg>
  )
}

/**
 * Persistent floating WhatsApp contact button — visible on every screen,
 * matching the reference prototype (agendamento.html).
 */
export function FloatingWhatsapp() {
  return (
    <a
      href={`https://wa.me/${BRAND.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-6 right-6 z-[400] w-14 h-14 rounded-full bg-[#2E5A3E] flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105"
    >
      <WhatsappIcon />
    </a>
  )
}

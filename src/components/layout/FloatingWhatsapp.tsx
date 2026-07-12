'use client'

import { BRAND } from '@/config/brand'
import { ChatBubbleIcon } from '@/components/icons/ChatBubbleIcon'

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
      className="fixed bottom-6 right-6 z-[400] w-[64px] h-[64px] rounded-full bg-[#2E5A3E] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105"
    >
      <ChatBubbleIcon size={26} />
    </a>
  )
}

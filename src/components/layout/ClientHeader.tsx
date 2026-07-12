'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

/**
 * Header for client-area screens (/conta, /perfil/*, /agendar, /entrar) —
 * deliberately mirrors Nav's desktop bar exactly (same fixed full-width
 * container, same padding, same logo classes) so the brand mark and theme
 * toggle land at the identical position/height as the public landing page.
 */
export function ClientHeader({
  backHref,
  title,
  right,
}: {
  backHref?: string
  title?: string
  right?: React.ReactNode
}) {
  return (
    <nav
      role="navigation"
      aria-label="Navegação da área do cliente"
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-8 xl:px-[60px] py-6 bg-charcoal border-b border-offwhite/8"
    >
      {backHref ? (
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href={backHref}
            aria-label="Voltar"
            className="font-body font-light text-lg text-offwhite/40 hover:text-offwhite/70 transition-colors shrink-0"
          >
            ←
          </Link>
          {title && (
            <span className="font-display font-light text-[19px] text-offwhite tracking-[0.02em] truncate">
              {title}
            </span>
          )}
        </div>
      ) : (
        <Link
          href="/"
          aria-label="Alison Estevam — Início"
          className="font-display font-normal text-lg tracking-[0.08em] uppercase text-offwhite/85 hover:text-offwhite transition-colors leading-none whitespace-nowrap"
        >
          Alison Estevam
        </Link>
      )}

      <div className="flex items-center gap-4 shrink-0">
        <ThemeToggle />
        {right}
      </div>
    </nav>
  )
}

export const clientHeaderLinkCls =
  'font-body font-light text-2xs tracking-nav uppercase text-offwhite/50 hover:text-offwhite/85 transition-colors duration-250 px-1'

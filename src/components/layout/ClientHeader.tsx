'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

/**
 * Header for client-area screens (/conta, /perfil/*, /agendar, /entrar) —
 * deliberately mirrors Nav's desktop bar exactly (same fixed full-width
 * container, same h-[56px], same logo classes) so the brand mark and theme
 * toggle land at the identical position/height as the public landing page —
 * and both match AdminTopBar's h-[56px], so the barber and client areas of
 * the site read as the same system. `fullWidth` drops the 1400px reading
 * measure for the dashboard screens (/conta, /perfil/*), where the icon
 * cluster should hug the true screen edge like AdminTopBar's does, instead
 * of stopping short at a centered box.
 */
export function ClientHeader({
  backHref,
  title,
  search,
  right,
  fullWidth = false,
}: {
  backHref?: string
  title?: string
  search?: React.ReactNode
  right?: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <nav
      role="navigation"
      aria-label="Navegação da área do cliente"
      className="fixed top-0 left-0 right-0 z-[200] h-[56px] bg-charcoal border-b border-offwhite/[0.08]"
    >
    <div className={cn('h-full flex items-center gap-6 px-8 xl:px-[60px]', fullWidth ? 'w-full' : 'max-w-[1400px] mx-auto')}>
      <div className="flex items-center gap-5 min-w-0">
        <Link
          href="/"
          aria-label="Alison Estevam — Início"
          className={cn(
            'font-display font-normal text-lg tracking-[0.08em] uppercase text-offwhite/85 hover:text-offwhite transition-colors leading-none whitespace-nowrap shrink-0',
            backHref && 'hidden md:inline-block'
          )}
        >
          Alison Estevam
        </Link>
        {backHref && (
          <div className="flex items-center gap-4 min-w-0 md:pl-5 md:border-l md:border-offwhite/[0.1]">
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
        )}
        {search && <div className="hidden md:block">{search}</div>}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-4 shrink-0">
        {right ?? <ThemeToggle />}
      </div>
    </div>
    </nav>
  )
}

export const clientHeaderLinkCls =
  'font-body font-light text-2xs tracking-nav uppercase text-offwhite/50 hover:text-offwhite/85 transition-colors duration-250 px-1'

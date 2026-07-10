'use client'

import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '#sobre',       label: 'Sobre' },
  { href: '#portfolio',   label: 'Portfólio' },
  { href: '#servicos',    label: 'Serviços' },
  { href: '#cuidados',    label: 'Cuidados' },
  { href: '#depoimentos', label: 'Depoimentos' },
]

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 10.5c-.83 0-1.63-.13-2.38-.38a.75.75 0 0 0-.77.19l-1.47 1.47a11.24 11.24 0 0 1-4.66-4.66l1.47-1.47a.75.75 0 0 0 .19-.77A7.54 7.54 0 0 1 5.5 2.5.75.75 0 0 0 4.75 2H2.5a.75.75 0 0 0-.75.75C1.75 9.1 6.9 14.25 13.25 14.25A.75.75 0 0 0 14 13.5v-2.25a.75.75 0 0 0-.5-.75Z" fill="currentColor"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="2.7" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="12" cy="4" r="0.8" fill="currentColor"/>
    </svg>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      id="contato"
      role="contentinfo"
      className="bg-charcoal border-t border-offwhite/8 px-6 pt-[64px] pb-[36px] md:px-[60px] md:pt-[88px]"
    >
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[52px] md:gap-9">

        {/* Brand */}
        <div>
          <div className="font-display font-normal text-4xl tracking-[0.03em] uppercase text-offwhite leading-[1.15]">
            Alison<br />Estevam
          </div>
        </div>

        {/* Como chegar + contact */}
        <div>
          <p className="font-display font-normal text-lg tracking-[0.1em] uppercase text-offwhite mb-5">
            Como Chegar
          </p>
          <p className="font-body font-light text-sm text-offwhite/55 leading-[1.8] mb-5">
            Rua Portugal, 443<br />
            Jardim Celani - Salto / SP<br />
            13.326-145, Brasil
          </p>
          <p className="font-body font-medium text-xs tracking-[0.05em] text-offwhite/75 leading-[1.9] mb-6">
            SEGUNDA A SEXTA · 10h às 20h<br />
            SÁBADO · 8h às 15h
          </p>

          <div className="flex flex-col gap-4">
            <a
              href={`https://wa.me/${BRAND.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 group"
            >
              <span className="w-8 h-8 rounded-full bg-gold text-charcoal-deep flex items-center justify-center shrink-0">
                <PhoneIcon />
              </span>
              <span className="font-body font-light text-sm text-offwhite/70 group-hover:text-offwhite transition-colors">
                (11) 97536-9904
              </span>
            </a>
            <a
              href={BRAND.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 group"
            >
              <span className="w-8 h-8 border border-gold text-gold flex items-center justify-center shrink-0">
                <InstagramIcon />
              </span>
              <span className="font-body font-light text-sm tracking-[0.1em] text-offwhite/70 group-hover:text-offwhite transition-colors">
                @ALISONESTEVAM
              </span>
            </a>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Navegação do rodapé">
          <p className="font-display font-normal text-lg tracking-[0.1em] uppercase text-offwhite mb-5">
            Navegação
          </p>
          <ul className="flex flex-col gap-4 list-none">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  className={cn(
                    'font-body font-light text-sm tracking-[0.15em] uppercase',
                    'text-offwhite/55 hover:text-offwhite transition-colors duration-300'
                  )}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1100px] mx-auto mt-[52px] pt-6 border-t border-offwhite/8 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <p className="font-body font-light text-2xs tracking-[0.1em] text-offwhite/30">
          © {year} {BRAND.name}. Todos os direitos reservados.
        </p>
        <p className="font-body font-light text-2xs tracking-[0.1em] text-offwhite/30">
          Crafted with intention.
        </p>
      </div>
    </footer>
  )
}

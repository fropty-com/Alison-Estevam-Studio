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
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 10.5c-.83 0-1.63-.13-2.38-.38a.75.75 0 0 0-.77.19l-1.47 1.47a11.24 11.24 0 0 1-4.66-4.66l1.47-1.47a.75.75 0 0 0 .19-.77A7.54 7.54 0 0 1 5.5 2.5.75.75 0 0 0 4.75 2H2.5a.75.75 0 0 0-.75.75C1.75 9.1 6.9 14.25 13.25 14.25A.75.75 0 0 0 14 13.5v-2.25a.75.75 0 0 0-.5-.75Z" fill="currentColor"/>
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.16.51.5.9 1.11 1.16 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.11 0 2.72-.01 3.06-.06 4.12-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.16 1.77 4.9 4.9 0 0 1-1.77 1.16c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06-2.72 0-3.06-.01-4.12-.06-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12c0-2.72.01-3.06.06-4.12.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.16-1.77a4.9 4.9 0 0 1 1.77-1.16c.64-.25 1.37-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5ZM17.4 5.15a1.17 1.17 0 1 0 0 2.34 1.17 1.17 0 0 0 0-2.34Z"/>
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
          <div className="font-display font-normal text-[26px] tracking-[0.06em] uppercase text-offwhite leading-[1.25]">
            Alison<br />Estevam
          </div>
        </div>

        {/* Como chegar + contact */}
        <div>
          <p className="font-display font-normal text-base tracking-[0.12em] uppercase text-offwhite mb-5">
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
              <span className="w-5 h-5 rounded-full bg-gold text-charcoal-deep flex items-center justify-center shrink-0">
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
              <span className="w-5 h-5 rounded-full bg-gold text-charcoal-deep flex items-center justify-center shrink-0">
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
          <p className="font-display font-normal text-base tracking-[0.12em] uppercase text-offwhite mb-5">
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

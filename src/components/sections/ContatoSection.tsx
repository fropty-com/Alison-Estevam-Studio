'use client'

export function ContatoSection() {
  return (
    <section
      id="contato"
      aria-labelledby="contato-titulo"
      className="bg-charcoal section-wrap"
    >
      {/* Header */}
      <div className="text-center mb-[64px]">
        <div className="section-tag justify-center" aria-hidden="true">Encontre-nos</div>
        <h2
          id="contato-titulo"
          className="reveal font-display font-normal text-[clamp(36px,5vw,58px)] text-offwhite tracking-[0.04em] uppercase"
        >
          Como Chegar
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px]">

        {/* Map */}
        <div className="reveal relative overflow-hidden bg-offwhite/[0.03] border border-offwhite/8" style={{ minHeight: 360 }}>
          <iframe
            title="Localização Alison Estevam Studio"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-47.3050%2C-23.2160%2C-47.2650%2C-23.1860&layer=mapnik&marker=-23.2010%2C-47.2850"
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: 360, filter: 'grayscale(1) invert(0.88) contrast(0.85)' }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div
            className="absolute inset-0 pointer-events-none border border-offwhite/8"
            aria-hidden="true"
          />
        </div>

        {/* Contact info */}
        <div className="reveal reveal-d1 border border-offwhite/8 p-[48px] flex flex-col justify-between gap-10 bg-offwhite/[0.02]">
          <div>
            <p className="font-body font-light text-2xs tracking-[0.45em] uppercase text-gold mb-[32px]">
              Alison Estevam Studio
            </p>

            <ul className="flex flex-col gap-[28px]">

              {/* Address placeholder */}
              <li className="flex items-start gap-4">
                <span className="mt-[2px] shrink-0 text-gold/60" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.49-2.01-4.5-4.5-4.5ZM8 7.75A1.75 1.75 0 1 1 8 4.25a1.75 1.75 0 0 1 0 3.5Z" fill="currentColor"/>
                  </svg>
                </span>
                <div>
                  <p className="font-body font-light text-xs tracking-[0.2em] uppercase text-offwhite/30 mb-[4px]">Endereço</p>
                  <p className="font-body font-light text-sm text-offwhite/60 leading-[1.7]">
                    Rua Portugal, 443<br />
                    Jd Celani — Salto SP<br />
                    13326-145, Brasil
                  </p>
                </div>
              </li>

              {/* Phone */}
              <li className="flex items-start gap-4">
                <span className="mt-[2px] shrink-0 text-gold/60" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 10.5c-.83 0-1.63-.13-2.38-.38a.75.75 0 0 0-.77.19l-1.47 1.47a11.24 11.24 0 0 1-4.66-4.66l1.47-1.47a.75.75 0 0 0 .19-.77A7.54 7.54 0 0 1 5.5 2.5.75.75 0 0 0 4.75 2H2.5a.75.75 0 0 0-.75.75C1.75 9.1 6.9 14.25 13.25 14.25A.75.75 0 0 0 14 13.5v-2.25a.75.75 0 0 0-.5-.75Z" fill="currentColor"/>
                  </svg>
                </span>
                <div>
                  <p className="font-body font-light text-xs tracking-[0.2em] uppercase text-offwhite/30 mb-[4px]">Telefone / WhatsApp</p>
                  <a
                    href="https://wa.me/5511975369904"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body font-light text-sm text-offwhite/65 hover:text-offwhite transition-colors duration-200"
                  >
                    +55 11 97536-9904
                  </a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-4">
                <span className="mt-[2px] shrink-0 text-gold/60" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="3.5" width="13" height="9" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M1.5 5l6.5 4.5L14.5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <p className="font-body font-light text-xs tracking-[0.2em] uppercase text-offwhite/30 mb-[4px]">E-mail</p>
                  <a
                    href="mailto:alison.estevam@gmail.com"
                    className="font-body font-light text-sm text-offwhite/65 hover:text-offwhite transition-colors duration-200"
                  >
                    alison.estevam@gmail.com
                  </a>
                </div>
              </li>

              {/* Instagram */}
              <li className="flex items-start gap-4">
                <span className="mt-[2px] shrink-0 text-gold/60" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor"/>
                  </svg>
                </span>
                <div>
                  <p className="font-body font-light text-xs tracking-[0.2em] uppercase text-offwhite/30 mb-[4px]">Instagram</p>
                  <a
                    href="https://www.instagram.com/alisonestevam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body font-light text-sm text-offwhite/65 hover:text-offwhite transition-colors duration-200"
                  >
                    @alisonestevam
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Book CTA */}
          <button
            onClick={() => window.dispatchEvent(new Event('open-booking'))}
            className="inline-flex items-center justify-center gap-3 font-body font-light text-2xs tracking-[0.4em] uppercase text-charcoal-deep bg-gold px-8 py-[14px] transition-all duration-300 hover:bg-gold-light hover:shadow-[0_12px_32px_rgba(201,169,110,0.28)] hover:-translate-y-px active:translate-y-0"
          >
            Agendar agora →
          </button>
        </div>
      </div>
    </section>
  )
}

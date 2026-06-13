'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

const CORTES = [
  { src: '/images/corte1.png', alt: 'Corte de precisão com detalhe lateral',   label: 'Precisão' },
  { src: '/images/corte2.png', alt: 'Cabelo volumoso com fade e barba',         label: 'Volume & Barba' },
  { src: '/images/corte3.png', alt: 'Cabelo longo com barba — perfil',          label: 'Cabelo Longo' },
  { src: '/images/corte4.png', alt: 'High fade com barba — perfil',             label: 'High Fade' },
  { src: '/images/corte5.png', alt: 'Corte texturizado',                        label: 'Texturizado' },
]

export function GaleriaSection() {
  return (
    <section
      id="galeria"
      aria-labelledby="galeria-titulo"
      className="bg-charcoal-mid section-wrap"
    >
      {/* ── Top: portrait + text ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-[80px] items-center mb-[80px]">

        {/* Portrait */}
        <div>
          <div className="section-tag" aria-hidden="true">O Profissional</div>
          <div className="gallery-img relative overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: 540 }}>
            <Image
              src="/images/alison1.png"
              alt="Alison Estevam — barbeiro e fundador"
              fill
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover object-top"
              priority
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.65) 0%, transparent 40%)' }}
              aria-hidden="true"
            />
            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3">
              <span className="block w-5 h-px bg-gold/45" aria-hidden="true" />
              <p className="font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/45">
                Alison Estevam · Fundador
              </p>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-7">
          <h2
            id="galeria-titulo"
            className="reveal font-display font-normal text-[clamp(34px,4.5vw,52px)] text-offwhite leading-[1.05] tracking-[0.03em] text-balance"
          >
            Arte executada com precisão
          </h2>

          <p className="reveal reveal-d1 font-body font-light text-base leading-[2.1] text-offwhite/50">
            Cada corte é resultado de anos de prática e uma escuta atenta ao que cada cliente precisa. Não existe fórmula — existe atenção aos detalhes.
          </p>

          <p className="reveal reveal-d2 font-body font-light text-base leading-[2.1] text-offwhite/38">
            Desde 2018 aperfeiçoando técnica e referência estética. O resultado fala por si mesmo — cada trabalho é uma assinatura individual.
          </p>

          {/* Mini stats */}
          <div className="reveal reveal-d3 grid grid-cols-3 gap-4 pt-4 border-t border-offwhite/8">
            {[
              { value: '8+',   label: 'Anos' },
              { value: '100%', label: 'Exclusivo' },
              { value: '✦',    label: 'Tesoura' },
            ].map(s => (
              <div key={s.value} className="text-center">
                <p className="font-data font-normal text-2xl text-gold leading-none mb-1">{s.value}</p>
                <p className="font-body font-light text-2xs tracking-[0.2em] uppercase text-offwhite/28">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Portfolio carousel ── */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="section-tag !mb-0" aria-hidden="true">O Portfólio</div>
          <a
            href="https://www.instagram.com/alisonestevam"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body font-light text-2xs tracking-[0.3em] uppercase text-offwhite/28 hover:text-offwhite/60 transition-colors duration-200 flex items-center gap-2"
          >
            Ver no Instagram →
          </a>
        </div>

        {/* Infinite horizontal scroll carousel */}
        <div className="overflow-hidden relative" aria-label="Portfólio de cortes">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgb(var(--c-charcoal-mid)), transparent)' }}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgb(var(--c-charcoal-mid)), transparent)' }}
            aria-hidden="true"
          />

          <div className="flex gap-[4px] animate-carousel hover:[animation-play-state:paused]">
            {[...CORTES, ...CORTES, ...CORTES].map((c, i) => (
              <div
                key={i}
                className="gallery-img relative shrink-0 overflow-hidden"
                style={{ width: '220px', height: '290px' }}
              >
                <Image
                  src={c.src}
                  alt={c.alt}
                  fill
                  sizes="220px"
                  className="object-cover object-top"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.65) 0%, transparent 50%)' }}
                  aria-hidden="true"
                />
                <p className="absolute bottom-4 left-4 font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/55">
                  {c.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

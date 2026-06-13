'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

const CORTES = [
  { src: '/images/corte1.png', alt: 'Corte de precisão com detalhe lateral',   label: 'Precisão' },
  { src: '/images/corte2.png', alt: 'Cabelo volumoso com fade e barba',         label: 'Volume & Barba' },
  { src: '/images/corte3.png', alt: 'Cabelo longo com barba — perfil',          label: 'Cabelo Longo' },
  { src: '/images/corte4.png', alt: 'High fade com barba — perfil',             label: 'High Fade' },
  { src: '/images/corte5.png', alt: 'Corte texturizado bowl cut',               label: 'Texturizado' },
]

export function GaleriaSection() {
  const stripRef = useRef<HTMLDivElement>(null)

  function scroll(dir: 1 | -1) {
    stripRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' })
  }

  return (
    <section
      id="galeria"
      aria-labelledby="galeria-titulo"
      className="bg-charcoal section-wrap"
    >
      {/* Top: portrait + text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-[72px] items-start mb-[80px]">

        {/* Portrait */}
        <div className="relative">
          <div className="section-tag" aria-hidden="true">O Profissional</div>
          <div className="gallery-img relative overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: 520 }}>
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
              style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.6) 0%, transparent 42%)' }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="block w-5 h-px bg-gold/45" aria-hidden="true" />
            <p className="font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/32">
              Alison Estevam · Fundador
            </p>
          </div>
        </div>

        {/* Text block */}
        <div className="flex flex-col justify-center gap-8 md:pt-[72px]">
          <h2
            id="galeria-titulo"
            className="reveal font-display font-light text-5xl text-offwhite leading-[1.05] text-balance"
          >
            Arte executada com precisão
          </h2>

          <p className="reveal reveal-d1 font-body font-light text-base leading-[2.1] text-offwhite/50 max-w-[400px]">
            Cada corte é resultado de anos de prática e uma escuta atenta ao
            que cada cliente precisa. Não existe fórmula — existe atenção aos
            detalhes.
          </p>

          <p className="reveal reveal-d2 font-body font-light text-base leading-[2.1] text-offwhite/40 max-w-[400px]">
            Desde 2018 aperfeiçoando técnica e referência estética. O resultado
            fala por si mesmo — cada trabalho é uma assinatura.
          </p>

          <div className="reveal reveal-d3 flex items-center gap-4 mt-2">
            <span className="block w-8 h-px bg-gold/40" aria-hidden="true" />
            <p className="font-body font-light text-xs tracking-[0.45em] uppercase text-gold/70">
              8+ anos · 100% exclusivo
            </p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-offwhite/6 mb-[60px]" aria-hidden="true" />

      {/* Work carousel */}
      <div>
        <div className="flex items-center justify-between mb-[36px]">
          <div className="section-tag !mb-0" aria-hidden="true">Trabalhos</div>
          {/* Prev / Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll(-1)}
              aria-label="Anterior"
              className="w-8 h-8 flex items-center justify-center border border-offwhite/12 text-offwhite/35 hover:border-offwhite/30 hover:text-offwhite/70 transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => scroll(1)}
              aria-label="Próximo"
              className="w-8 h-8 flex items-center justify-center border border-offwhite/12 text-offwhite/35 hover:border-offwhite/30 hover:text-offwhite/70 transition-colors duration-200"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div
          ref={stripRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          aria-label="Galeria de trabalhos"
        >
          {CORTES.map((c, i) => (
            <div
              key={i}
              className={cn(
                'gallery-img relative shrink-0 snap-start overflow-hidden',
                'border border-offwhite/6 hover:border-offwhite/18 transition-colors duration-300'
              )}
              style={{ width: 260, aspectRatio: '3/4' }}
            >
              <Image
                src={c.src}
                alt={c.alt}
                fill
                sizes="260px"
                className="object-cover object-top"
              />
              {/* Label overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-4 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.75) 0%, transparent 60%)' }}
                aria-hidden="true"
              />
              <p className="absolute bottom-4 left-4 font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55">
                {c.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

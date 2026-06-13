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

      {/* ── Portfolio grid ── */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="section-tag !mb-0" aria-hidden="true">The Portfolio</div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body font-light text-2xs tracking-[0.3em] uppercase text-offwhite/28 hover:text-offwhite/60 transition-colors duration-200 flex items-center gap-2"
          >
            Ver no Instagram →
          </a>
        </div>

        {/* Asymmetric grid: 1 tall left + 2x2 right */}
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-[3px]">

          {/* Left — tall featured */}
          <div className="gallery-img relative overflow-hidden row-span-2" style={{ aspectRatio: '2/3', minHeight: 400 }}>
            <Image
              src={CORTES[0].src}
              alt={CORTES[0].alt}
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="object-cover object-top"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.7) 0%, transparent 45%)' }}
              aria-hidden="true"
            />
            <p className="absolute bottom-5 left-5 font-body font-light text-xs tracking-[0.4em] uppercase text-offwhite/60">
              {CORTES[0].label}
            </p>
          </div>

          {/* Right top-left */}
          <div className="gallery-img relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
            <Image src={CORTES[1].src} alt={CORTES[1].alt} fill sizes="(max-width:768px) 50vw, 22vw" className="object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.6) 0%, transparent 45%)' }} aria-hidden="true" />
            <p className="absolute bottom-4 left-4 font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/55">{CORTES[1].label}</p>
          </div>

          {/* Right top-right */}
          <div className="gallery-img relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
            <Image src={CORTES[2].src} alt={CORTES[2].alt} fill sizes="(max-width:768px) 50vw, 22vw" className="object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.6) 0%, transparent 45%)' }} aria-hidden="true" />
            <p className="absolute bottom-4 left-4 font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/55">{CORTES[2].label}</p>
          </div>

          {/* Right bottom-left */}
          <div className="gallery-img relative overflow-hidden" style={{ aspectRatio: '4/5' }}>
            <Image src={CORTES[3].src} alt={CORTES[3].alt} fill sizes="(max-width:768px) 50vw, 22vw" className="object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.6) 0%, transparent 45%)' }} aria-hidden="true" />
            <p className="absolute bottom-4 left-4 font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/55">{CORTES[3].label}</p>
          </div>

          {/* Right bottom-right — label card */}
          <div
            className={cn(
              'relative overflow-hidden flex flex-col items-center justify-center gap-3',
              'border border-offwhite/8',
              'bg-offwhite/[0.03]'
            )}
            style={{ aspectRatio: '4/5' }}
          >
            <Image src={CORTES[4].src} alt={CORTES[4].alt} fill sizes="(max-width:768px) 50vw, 22vw" className="object-cover object-top" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,12,10,0.6) 0%, transparent 45%)' }} aria-hidden="true" />
            <p className="absolute bottom-4 left-4 font-body font-light text-xs tracking-[0.35em] uppercase text-offwhite/55">{CORTES[4].label}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

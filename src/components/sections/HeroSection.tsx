'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  onScheduleClick: () => void
}

export function HeroSection({ onScheduleClick }: HeroSectionProps) {
  return (
    <section
      className="relative min-h-svh bg-charcoal overflow-hidden flex flex-col md:flex-row"
      aria-label="Apresentação"
    >
      {/* ── Text side ── */}
      <div className={cn(
        'relative z-10 flex flex-col justify-center',
        'px-6 pt-[100px] pb-12 md:px-[60px] md:py-0 md:pt-[88px]',
        'w-full md:w-[58%] flex-shrink-0',
      )}>

        {/* Eyebrow */}
        <div className="flex items-center gap-4 mb-8 opacity-0 animate-fade-up [animation-delay:200ms]">
          <span className="block w-6 h-px bg-gold/55" aria-hidden="true" />
          <p className="font-body font-light text-2xs tracking-label uppercase text-gold/80">
            Barbearia · Atendimento Exclusivo
          </p>
        </div>

        {/* Title */}
        <h1
          className={cn(
            'font-display font-normal tracking-[0.06em] uppercase text-offwhite',
            'text-[clamp(56px,8.5vw,118px)] leading-[0.9]',
            'opacity-0 animate-fade-up [animation-delay:400ms]'
          )}
        >
          Alison<br />
          <span className="text-offwhite/65">Estevam</span>
        </h1>

        {/* Description */}
        <p className={cn(
          'mt-8 max-w-[380px]',
          'font-body font-light text-base leading-[2] text-offwhite/42',
          'opacity-0 animate-fade-up [animation-delay:600ms]'
        )}>
          Uma experiência que vai além do corte. Cada detalhe pensado para o seu bem-estar — do ambiente à finalização.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap gap-4 opacity-0 animate-fade-up [animation-delay:800ms]">
          <button
            onClick={onScheduleClick}
            className={cn(
              'group inline-flex items-center gap-4',
              'font-body font-light text-2xs tracking-[0.4em] uppercase',
              'text-charcoal-deep bg-gold px-8 py-[14px]',
              'relative overflow-hidden',
              'transition-all duration-300',
              'hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(201,169,110,0.3)]'
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" aria-hidden="true" />
            Agendar agora
            <span className="text-sm transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true">→</span>
          </button>

          <a
            href="#servicos"
            className={cn(
              'inline-flex items-center gap-3',
              'font-body font-light text-2xs tracking-[0.4em] uppercase',
              'text-offwhite/55 border border-offwhite/18 px-8 py-[14px]',
              'transition-all duration-300 hover:text-offwhite hover:border-offwhite/40'
            )}
          >
            Ver serviços
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-16 flex gap-10 opacity-0 animate-fade-up [animation-delay:1000ms]">
          {[
            { value: '8+',   label: 'Anos de experiência' },
            { value: '100%', label: 'Atendimento exclusivo' },
            { value: '✦',    label: 'Mestre em tesoura' },
          ].map(s => (
            <div key={s.value}>
              <p className="font-data font-normal text-2xl text-gold leading-none mb-1">{s.value}</p>
              <p className="font-body font-light text-2xs tracking-[0.15em] text-offwhite/30">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 hidden md:flex flex-col items-start gap-[10px] opacity-0 animate-fade-up [animation-delay:1200ms]" aria-hidden="true">
          <div className="w-px h-[46px] bg-gradient-to-b from-gold/55 to-transparent animate-scroll-line" />
          <span className="font-body font-light text-2xs tracking-label uppercase text-offwhite/16">rolar</span>
        </div>
      </div>

      {/* ── Photo side ── */}
      <div className="relative flex-1 min-h-[50vw] md:min-h-0">
        <Image
          src="/images/alison1.png"
          alt="Alison Estevam — barbeiro"
          fill
          sizes="(max-width: 768px) 100vw, 42vw"
          className="object-cover object-top"
          priority
        />
        {/* Left-side gradient mask for blend */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, rgb(var(--c-charcoal)) 0%, transparent 35%), linear-gradient(to top, rgb(var(--c-charcoal)) 0%, transparent 18%)'
          }}
          aria-hidden="true"
        />
        {/* Top dark strip */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgb(var(--c-charcoal)) 0%, transparent 15%)' }}
          aria-hidden="true"
        />
      </div>

      {/* Subtle radial glow behind text */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[60%] pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 25% 50%, rgba(201,169,110,0.04) 0%, transparent 60%)' }}
        aria-hidden="true"
      />
    </section>
  )
}

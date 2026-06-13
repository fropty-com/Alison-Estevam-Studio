'use client'

import { cn } from '@/lib/utils'

interface HeroSectionProps {
  onScheduleClick: () => void
}

export function HeroSection({ onScheduleClick }: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative min-h-svh bg-charcoal overflow-hidden',
        'flex flex-col items-center justify-end',
        'px-6 pb-[14vh] md:px-[60px]',
        'text-center noise-overlay'
      )}
      aria-label="Apresentação"
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% 28%, rgba(201,169,110,0.045) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 15% 85%, rgba(122,145,130,0.025) 0%, transparent 60%)
          `
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">

        {/* Ornament divider */}
        <div
          className="flex items-center justify-center gap-[18px] mb-[42px]
                     opacity-0 animate-fade-up [animation-delay:300ms]"
          aria-hidden="true"
        >
          <div className="w-[54px] h-px bg-gradient-to-r from-transparent to-gold/48" />
          <div className="w-[3px] h-[3px] bg-gold rounded-full opacity-55" />
          <div className="w-[54px] h-px bg-gradient-to-l from-transparent to-gold/48" />
        </div>

        {/* Title */}
        <h1
          className={cn(
            'font-display font-light tracking-display uppercase text-offwhite',
            'text-7xl leading-[0.94]',
            'opacity-0 animate-fade-up [animation-delay:500ms]'
          )}
        >
          Alison
          <span className="block text-offwhite/72 mt-[6px]">Estevam</span>
        </h1>

        {/* Eyebrow — below title */}
        <p
          className="font-body font-light text-2xs tracking-label uppercase text-gold mt-[22px]
                     opacity-0 animate-fade-up [animation-delay:700ms]"
          aria-hidden="true"
        >
          Barbearia · Atendimento Exclusivo
        </p>

        {/* Description */}
        <div className="mt-[38px] opacity-0 animate-fade-up [animation-delay:900ms]">
          <p className="max-w-[315px] font-body font-light text-sm leading-[2.05] tracking-[0.1em] text-offwhite/26 text-center mx-auto">
            Uma experiência que vai além do corte. Cada detalhe pensado para o seu bem-estar — do ambiente à finalização.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-[34px] opacity-0 animate-fade-up [animation-delay:1100ms]">
          <button
            onClick={onScheduleClick}
            className={cn(
              'group inline-flex items-center gap-4',
              'font-body font-light text-2xs tracking-[0.4em] uppercase',
              'text-charcoal-deep bg-gold px-8 py-[14px]',
              'relative overflow-hidden',
              'transition-all duration-300 ease-brand-out',
              'hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(201,169,110,0.26)]',
              'active:translate-y-0'
            )}
          >
            {/* Gloss */}
            <span className="absolute inset-0 bg-gradient-to-br from-white/11 to-transparent pointer-events-none" aria-hidden="true" />
            Agendar agora
            <span
              className="text-sm transition-transform duration-300 ease-brand-out group-hover:translate-x-1.5"
              aria-hidden="true"
            >
              →
            </span>
          </button>
        </div>

        {/* Scroll indicator */}
        <div
          className="mt-[50px] flex flex-col items-center gap-[10px] opacity-0 animate-fade-up [animation-delay:1350ms]"
          aria-hidden="true"
        >
          <div className="w-px h-[46px] bg-gradient-to-b from-gold/55 to-transparent animate-scroll-line" />
          <span className="font-body font-light text-2xs tracking-label uppercase text-offwhite/16">rolar</span>
        </div>
      </div>
    </section>
  )
}

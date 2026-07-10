'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { BRAND } from '@/config/brand'

interface HeroSectionProps {
  onScheduleClick: () => void
}

export function HeroSection({ onScheduleClick }: HeroSectionProps) {
  return (
    <section
      className="relative bg-charcoal pt-6 pb-10 lg:pt-[132px] lg:pb-[100px] px-4 lg:px-[60px]"
      aria-label="Apresentação"
    >
      <div className="lg:max-w-[560px] lg:mx-auto">

        {/* "ALISON" — sits directly above the image, flush against it */}
        <h1 className="text-center overflow-hidden">
          <span
            className={cn(
              'block font-display font-normal uppercase text-offwhite',
              'text-[15vw] leading-[0.8] md:text-[64px] tracking-[0]'
            )}
          >
            Alison
          </span>
        </h1>

        {/* Vertical image with "ESTEVAM" fully inside it, overlay buttons */}
        <div className="relative mt-1 overflow-hidden" style={{ aspectRatio: '2/3' }}>
          <Image
            src="/images/hero-barbershop.jpg"
            alt="Alison Estevam Studio — barbearia"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover grayscale"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(20,20,18,0.75) 0%, rgba(20,20,18,0.15) 45%, rgba(20,20,18,0.35) 100%)' }}
            aria-hidden="true"
          />

          {/* "ESTEVAM" — entirely inside the photo. Fixed light color (not
              theme-swapped): it always sits on a dark photo regardless of
              the site's light/dark theme. Horizontal padding + a
              conservative font size keep it clear of the photo's edges
              even with real-device font-rendering differences. */}
          <div className="absolute top-5 left-0 right-0 text-center px-6">
            <span
              className={cn(
                'block font-display font-normal uppercase text-[#F1F1F1]',
                'text-[11vw] leading-[0.8] lg:text-[46px] tracking-[0]'
              )}
            >
              Estevam
            </span>
          </div>

          {/* Overlay CTAs — also fixed light/gold, independent of theme */}
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-[14px] px-8">
            <button
              onClick={onScheduleClick}
              className={cn(
                'w-full max-w-[320px] py-[16px] text-center',
                'font-body font-semibold text-2xs tracking-[0.3em] uppercase',
                'text-[#1E1E1C] bg-gold',
                'transition-all duration-300 hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(203,163,57,0.3)]',
                'active:translate-y-0'
              )}
            >
              Agendar
            </button>
            <a
              href="#servicos"
              className={cn(
                'w-full max-w-[260px] py-[13px] text-center',
                'font-body font-light text-2xs tracking-[0.3em] uppercase',
                'text-[#F1F1F1] border border-[#F1F1F1]/70',
                'transition-all duration-300 hover:border-[#F1F1F1] hover:bg-[#F1F1F1]/10'
              )}
            >
              Ver Serviços
            </a>
          </div>
        </div>

        {/* Sub-actions */}
        <div className="mt-6 flex items-center justify-between px-1">
          <span className="font-body font-light text-2xs tracking-[0.05em] text-offwhite/45">
            Prefere conversar antes?
          </span>
          <a
            href={`https://wa.me/${BRAND.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-2 px-4 py-[9px]',
              'font-body font-medium text-2xs tracking-[0.15em] uppercase',
              'text-sage border border-sage/60',
              'transition-colors duration-200 hover:bg-sage/10'
            )}
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

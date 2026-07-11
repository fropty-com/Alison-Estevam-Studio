'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn, formatCurrency } from '@/lib/utils'

interface Service {
  id: string
  slug: string
  name: string
  description: string
  price: number
  duration: number
  is_whatsapp_only: boolean
}

// Decorative pairing only — not stored in the DB, which has no photo column.
const SERVICE_IMAGES: Record<string, string> = {
  'cabelo':            '/images/servico-cabelo.jpg',
  'barba':              '/images/servico-barba.jpg',
  'cabelo-e-barba':     '/images/servico-cabelo-e-barba.png',
  'corte-feminino':     '/images/servico-corte-feminino.png',
  'horario-exclusivo':  '/images/servico-horario-exclusivo.jpg',
}

function openBookingFor(serviceSlug: string) {
  window.dispatchEvent(new CustomEvent('open-booking', { detail: { serviceSlug } }))
}

export function ServicosSection() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServices(d.services ?? []))
      .catch(console.error)
  }, [])

  return (
    <section
      id="servicos"
      aria-labelledby="servicos-titulo"
      className="bg-charcoal section-wrap"
    >
      <div className="section-tag" aria-hidden="true">Serviços</div>
      <h2 id="servicos-titulo" className="sr-only">Serviços</h2>

      <div className="max-w-[720px] mx-auto border-t border-offwhite/8">
        {services.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'reveal', i > 0 && `reveal-d${Math.min(i, 4)}`,
              'flex gap-5 md:gap-8 py-[30px] border-b border-offwhite/8 items-center'
            )}
          >
            <div className="relative w-[110px] md:w-[160px] shrink-0 overflow-hidden" style={{ aspectRatio: '3/4' }}>
              <Image
                src={SERVICE_IMAGES[s.slug] ?? '/images/hero-barbershop.jpg'}
                alt={`Serviço ${s.name} — Alison Estevam Studio`}
                fill
                sizes="160px"
                className="object-cover grayscale"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display font-normal text-2xl md:text-3xl tracking-[0.168em] leading-[1.3] uppercase text-offwhite mb-[8px]">
                {s.name.split(' ').map((word, wi) =>
                  s.is_whatsapp_only && wi > 0
                    ? <span key={wi} className="text-gold"> {word}</span>
                    : <span key={wi}>{wi > 0 ? ' ' : ''}{word}</span>
                )}
              </h3>

              <p className="font-body font-light text-sm tracking-[0.07em] leading-[1.3] text-offwhite/50 mb-[16px] max-w-[420px]">
                {s.description}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-data italic font-normal text-xl tracking-[0.168em] leading-[1.3] text-gold">
                  {formatCurrency(s.price)}
                </span>
                <button
                  onClick={() => openBookingFor(s.slug)}
                  className={cn(
                    'font-body font-medium text-2xs tracking-[0.25em] uppercase',
                    'text-charcoal-deep bg-gold px-6 py-[11px]',
                    'transition-all duration-300 hover:bg-gold-light hover:-translate-y-px',
                  )}
                >
                  Agendar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

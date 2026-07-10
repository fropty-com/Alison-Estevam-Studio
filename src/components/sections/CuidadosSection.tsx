'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn, formatCurrency } from '@/lib/utils'

interface Complement {
  id: string
  slug: string
  name: string
  description: string
  price: number
}

const CUIDADO_IMAGES: Record<string, string> = {
  'design-sobrancelha':   '/images/cuidado-sobrancelha.jpg',
  'hidratacao-capilar':   '/images/cuidado-hidratacao.jpg',
  'revitalizacao-facial': '/images/cuidado-revitalizacao.jpg',
}

function openBooking() {
  window.dispatchEvent(new Event('open-booking'))
}

export function CuidadosSection() {
  const [complements, setComplements] = useState<Complement[]>([])

  useEffect(() => {
    fetch('/api/complements')
      .then(r => r.json())
      .then(d => setComplements(d.complements ?? []))
      .catch(console.error)
  }, [])

  return (
    <section
      id="cuidados"
      aria-labelledby="cuidados-titulo"
      className="bg-charcoal section-wrap"
    >
      <div className="section-tag" aria-hidden="true">Cuidados</div>
      <h2 id="cuidados-titulo" className="sr-only">Cuidados</h2>

      <div className="max-w-[720px] mx-auto border-t border-offwhite/8">
        {complements.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              'reveal', i > 0 && `reveal-d${Math.min(i, 4)}`,
              'flex gap-5 md:gap-8 py-[30px] border-b border-offwhite/8 items-center'
            )}
          >
            <div className="relative w-[110px] md:w-[160px] shrink-0 overflow-hidden" style={{ aspectRatio: '3/4' }}>
              <Image
                src={CUIDADO_IMAGES[c.slug] ?? '/images/hero-barbershop.jpg'}
                alt={`Cuidado ${c.name} — Alison Estevam Studio`}
                fill
                sizes="160px"
                className="object-cover grayscale"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display font-normal text-2xl md:text-3xl tracking-[0.168em] leading-[1.3] uppercase text-offwhite mb-[8px]">
                {c.name}
              </h3>

              <p className="font-body font-light text-sm tracking-[0.07em] leading-[1.3] text-offwhite/50 mb-[16px] max-w-[420px]">
                {c.description}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-data italic font-normal text-xl tracking-[0.168em] leading-[1.3] text-gold">
                  {formatCurrency(c.price)}
                </span>
                <button
                  onClick={openBooking}
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

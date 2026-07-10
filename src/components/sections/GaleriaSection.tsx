'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

const CORTES = [
  { src: '/images/portfolio-2.png', alt: 'Corte editorial masculino — buzz cut' },
  { src: '/images/portfolio-5.jpg', alt: 'Corte editorial masculino — ondulado' },
  { src: '/images/portfolio-3.jpg', alt: 'Corte editorial masculino — cacheado' },
  { src: '/images/portfolio-1.jpg', alt: 'Corte editorial masculino — high top fade' },
  { src: '/images/portfolio-4.jpg', alt: 'Corte editorial masculino — afro fade' },
  { src: '/images/portfolio-7.jpg', alt: 'Corte editorial masculino — textura curta' },
  { src: '/images/portfolio-6.jpg', alt: 'Corte editorial masculino — cabelo molhado' },
  { src: '/images/portfolio-8.jpg', alt: 'Corte editorial masculino — fade lateral' },
  { src: '/images/portfolio-9.jpg', alt: 'Corte editorial masculino — ondulado natural' },
]

export function GaleriaSection() {
  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-titulo"
      className="bg-charcoal section-wrap"
    >
      <div className="section-tag" aria-hidden="true">Portfólio</div>

      <h2
        id="portfolio-titulo"
        className="reveal font-display font-normal text-[clamp(30px,4vw,48px)] text-offwhite leading-[1] tracking-[0.15em] uppercase text-balance mb-4"
      >
        Trabalhos<br />Selecionados
      </h2>

      <p className="reveal reveal-d1 font-body font-light text-sm tracking-[0.07em] leading-[1.3] text-offwhite/45 mb-[42px] max-w-[380px]">
        Uma seleção de cortes realizados recentemente.
      </p>

      <div className="grid grid-cols-3 lg:grid-cols-4 gap-1 max-w-[1100px] mx-auto">
        {CORTES.map((c, i) => (
          <div
            key={c.src}
            className={cn(
              'gallery-img relative overflow-hidden',
              'reveal', i > 0 && `reveal-d${Math.min(i, 4)}`
            )}
            style={{ aspectRatio: '3/4' }}
          >
            <Image
              src={c.src}
              alt={c.alt}
              fill
              sizes="(max-width: 1024px) 33vw, 25vw"
              className={cn('object-cover', i % 2 === 1 && 'grayscale')}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

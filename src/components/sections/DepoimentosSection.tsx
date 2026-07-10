import { cn } from '@/lib/utils'

const DEPOIMENTOS = [
  {
    stars: 5,
    text: 'Gosto muito do atendimento e da experiência, ambiente tranquilo e exclusivo é ótimo serviço.',
    autor: 'Everton Santos',
    servico: 'CORTE DE CABELO',
  },
  {
    stars: 5,
    text: 'Gosto muito do atendimento e da experiência, ambiente tranquilo e exclusivo é ótimo serviço.',
    autor: 'Everton Santos',
    servico: 'CORTE DE CABELO',
  },
  {
    stars: 5,
    text: 'Gosto muito do atendimento e da experiência, ambiente tranquilo e exclusivo é ótimo serviço.',
    autor: 'Everton Santos',
    servico: 'CORTE DE CABELO',
  },
] as const

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-[3px]" aria-label={`${count} estrelas`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <polygon
            points="5.5,1 6.6,4.2 10,4.2 7.3,6.3 8.2,9.5 5.5,7.5 2.8,9.5 3.7,6.3 1,4.2 4.4,4.2"
            className="fill-gold"
          />
        </svg>
      ))}
    </div>
  )
}

export function DepoimentosSection() {
  return (
    <section
      id="depoimentos"
      aria-labelledby="depoimentos-titulo"
      className="bg-charcoal section-wrap"
    >
      <div className="text-center mb-[52px]">
        <h2
          id="depoimentos-titulo"
          className="reveal font-display font-normal text-[clamp(28px,4vw,42px)] leading-[1] tracking-[0.15em] uppercase text-offwhite"
        >
          Avaliação<br />dos Clientes
        </h2>
      </div>

      {/* Cards — background inverts relative to the page theme */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-[1000px] mx-auto">
        {DEPOIMENTOS.map((d, i) => (
          <div
            key={i}
            className={cn(
              'reveal', i > 0 && `reveal-d${i}`,
              'bg-offwhite p-[30px] flex flex-col gap-4'
            )}
          >
            <Stars count={d.stars} />

            <p className="font-body font-medium text-[15px] tracking-[0.07em] leading-[1.3] text-charcoal">
              {d.text}
            </p>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-display font-normal text-lg text-charcoal">{d.autor}</p>
                <p className="font-body font-medium text-2xs tracking-[0.15em] text-gold mt-[2px]">{d.servico}</p>
              </div>
              <span className="font-display text-3xl leading-none text-charcoal/15 select-none" aria-hidden="true">&rdquo;</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

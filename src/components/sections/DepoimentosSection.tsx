import { cn } from '@/lib/utils'

const DEPOIMENTOS = [
  {
    stars: 5,
    text: 'Melhor experiência em barbearia que já tive. O Alison entende exatamente o que você quer com poucas palavras — o corte saiu perfeito. Detalhe: o ambiente é impecável e tranquilo.',
    autor: 'Rafael M.',
    servico: 'Corte de Cabelo',
  },
  {
    stars: 5,
    text: 'Fiz o combo cabelo e barba e saí renovado. Atendimento completamente focado em mim, sem pressa, sem distração. Valeu cada centavo. Já marquei o próximo.',
    autor: 'Lucas T.',
    servico: 'Cabelo & Barba',
  },
  {
    stars: 5,
    text: 'Minha filha fez um Pixie Cut com o Alison e ficou linda. Ele tem uma sensibilidade única para entender o rosto de cada pessoa. Profissional de verdade.',
    autor: 'Patrícia A.',
    servico: 'Corte Feminino',
  },
] as const

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-[3px]" aria-label={`${count} estrelas`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <polygon
            points="5.5,1 6.6,4.2 10,4.2 7.3,6.3 8.2,9.5 5.5,7.5 2.8,9.5 3.7,6.3 1,4.2 4.4,4.2"
            fill="rgb(var(--c-gold))"
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
      className="bg-charcoal-mid section-wrap"
    >
      {/* Header */}
      <div className="text-center mb-[60px]">
        <div className="section-tag justify-center" aria-hidden="true">O que dizem</div>
        <h2
          id="depoimentos-titulo"
          className="reveal font-display font-normal text-[clamp(36px,4.5vw,56px)] text-offwhite tracking-[0.04em] uppercase"
        >
          Avaliações dos Clientes
        </h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] border border-offwhite/8">
        {DEPOIMENTOS.map((d, i) => (
          <div
            key={i}
            className={cn(
              'p-[38px] flex flex-col gap-5',
              'bg-offwhite/[0.02] border-offwhite/8',
              i < DEPOIMENTOS.length - 1 && 'md:border-r md:border-offwhite/8',
              'reveal', i > 0 && `reveal-d${i}`
            )}
          >
            <Stars count={d.stars} />

            <blockquote className="font-display font-light italic text-lg text-offwhite/65 leading-[1.7] flex-1">
              &ldquo;{d.text}&rdquo;
            </blockquote>

            <div className="pt-5 border-t border-offwhite/8 flex items-center justify-between">
              <div>
                <p className="font-body font-light text-sm text-offwhite/75">{d.autor}</p>
                <p className="font-body font-light text-xs tracking-[0.2em] uppercase text-gold/60 mt-[3px]">{d.servico}</p>
              </div>
              <span className="text-offwhite/12 font-display text-4xl leading-none select-none" aria-hidden="true">&rdquo;</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

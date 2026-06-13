import { cn } from '@/lib/utils'

const STATS = [
  {
    value:    '8+',
    label:    'Anos de experiência',
    sublabel: 'Desde 2018',
    size:     'text-[50px]',
  },
  {
    value:    '100%',
    label:    'Atendimento exclusivo',
    sublabel: 'Um cliente por vez',
    size:     'text-[50px]',
  },
  {
    value:    '✦',
    label:    'Especialista em corte com tesoura',
    sublabel: 'Técnica apurada',
    size:     'text-[32px]',
  },
] as const

export function SobreSection() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="sobre section-wrap bg-charcoal-mid"
    >
      <div className="section-tag" aria-hidden="true">Sobre</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[48px] md:gap-[96px] items-start">

        {/* Text column */}
        <div className="reveal">
          <h2
            id="sobre-titulo"
            className="font-display font-light text-5xl leading-[1.14] tracking-[0.02em] text-offwhite mb-[30px] text-balance"
          >
            Precisão que vira{' '}
            <em className="font-medium not-italic">
              <strong className="font-medium italic">assinatura.</strong>
            </em>
          </h2>

          <div className="w-[34px] h-px bg-gold opacity-50 mb-[30px]" aria-hidden="true" />

          <blockquote
            className={cn(
              'font-display font-light text-xl italic leading-[1.65] tracking-[0.02em]',
              'text-offwhite/70 mb-[34px] pl-[18px]',
              'border-l-2 border-gold/32'
            )}
          >
            O cuidado com os detalhes é o que separa o{' '}
            <strong className="font-medium italic">bom</strong>{' '}
            do{' '}
            <strong className="font-medium italic">excelente</strong>
          </blockquote>

          <p className="font-body font-light text-base leading-[1.92] tracking-[0.02em] text-offwhite/55 mb-[17px]">
            Desde 2018, aperfeiçoando cada técnica e cada detalhe. Hoje, o atendimento é exclusivo — um cliente por vez, sem pressa, com atenção total ao que realmente importa.
          </p>
          <p className="font-body font-light text-base leading-[1.92] tracking-[0.02em] text-offwhite/55">
            Um espaço pensado para proporcionar conforto, requinte e uma experiência que você vai querer repetir.
          </p>
        </div>

        {/* Stats column */}
        <div className="reveal reveal-d2 self-center grid grid-cols-1">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'flex flex-col gap-[5px] py-[30px]',
                'border-b border-offwhite/10',
                i === 0 && 'border-t border-offwhite/10',
              )}
            >
              <span
                className={cn(
                  'font-data font-normal text-gold leading-none',
                  stat.size,
                  stat.value === '✦' && '!text-[32px]'
                )}
                aria-hidden="true"
              >
                {stat.value}
              </span>
              <p className="font-body font-light text-base text-offwhite/85 tracking-[0.04em] leading-[1.4] mt-[6px]">
                {stat.label}
              </p>
              <p className="font-body font-light text-2xs tracking-[0.14em] uppercase text-offwhite/30">
                {stat.sublabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

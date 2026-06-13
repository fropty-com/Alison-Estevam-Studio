import { cn } from '@/lib/utils'

const PILLARS = [
  {
    title: 'Ambiente Sonoro',
    desc:  'Música ambiente cuidadosamente curada para criar a atmosfera certa desde o momento em que você entra.',
    delay: 'reveal-d1',
  },
  {
    title: 'Vaporizador de Ozônio',
    desc:  'Tecnologia que higieniza, relaxa e prepara a pele com precisão — substituindo o ritual clássico por algo ainda mais eficaz.',
    delay: 'reveal-d2',
  },
  {
    title: 'Café Expresso',
    desc:  'Um café no seu momento. Pequenos detalhes que transformam um serviço em uma experiência memorável.',
    delay: 'reveal-d3',
  },
  {
    title: 'Produtos Premium',
    desc:  'Finalização com produtos selecionados, garantindo resultado impecável e cuidado real com seu cabelo e barba.',
    delay: 'reveal-d4',
  },
] as const

export function ExperienciaSection() {
  return (
    <section
      id="experiencia"
      aria-labelledby="experiencia-titulo"
      className="experiencia section-wrap bg-charcoal-mid"
    >
      {/* Section tag — override colors for dark bg */}
      <div
        className="flex items-center gap-[18px] font-body font-light text-xs tracking-[0.5em]
                   uppercase text-sage/65 mb-[52px] before:content-[''] before:block
                   before:w-[26px] before:h-px before:bg-sage/35 before:shrink-0"
        aria-hidden="true"
      >
        A Experiência
      </div>

      <h2
        id="experiencia-titulo"
        className="reveal font-display font-light text-5xl text-offwhite leading-[1.14] mb-[60px] max-w-[500px] text-balance"
      >
        Cada visita é<br />uma experiência<br />completa.
      </h2>

      {/* Grid — 4 cols desktop, 2 mobile, 1 on small */}
      <div
        role="list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-offwhite/5"
      >
        {PILLARS.map(({ title, desc, delay }) => (
          <div
            key={title}
            role="listitem"
            className={cn(
              'reveal', delay,
              'group bg-charcoal-deep/60 px-[38px] py-[52px]',
              'relative overflow-hidden transition-colors duration-400',
              'hover:bg-charcoal-mid',
              // Gold underline on hover
              'after:content-[\'\'] after:absolute after:bottom-0 after:left-0',
              'after:h-[2px] after:w-0 after:bg-gold',
              'after:transition-[width] after:duration-400 after:ease-brand-out',
              'hover:after:w-full',
              // Reduced padding on tablet
              'md:px-7 md:py-11 lg:px-[38px] lg:py-[52px]'
            )}
          >
            {/* Animated line icon */}
            <div
              className="w-[26px] h-px bg-sage opacity-65 mb-[34px] transition-[width,opacity] duration-300 ease-brand-out group-hover:w-[42px] group-hover:opacity-100"
              aria-hidden="true"
            />
            <h3 className="font-display font-normal text-2xl text-offwhite mb-[14px] tracking-[0.04em] leading-[1.2]">
              {title}
            </h3>
            <p className="font-body font-light text-base leading-[1.92] text-offwhite/38 tracking-[0.04em]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

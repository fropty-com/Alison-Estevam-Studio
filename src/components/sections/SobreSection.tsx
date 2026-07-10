import Image from 'next/image'

export function SobreSection() {
  return (
    <section
      id="sobre"
      aria-labelledby="sobre-titulo"
      className="bg-charcoal section-wrap"
    >
      <div className="max-w-[560px] mx-auto text-center">
        <div className="section-tag justify-center" aria-hidden="true">Sobre</div>

        <h2
          id="sobre-titulo"
          className="reveal font-display font-normal text-[clamp(19px,5.2vw,40px)] leading-[1] tracking-[0.15em] uppercase text-offwhite mb-[42px] whitespace-nowrap"
        >
          Precisão que vira<br />assinatura
        </h2>

        <div className="reveal reveal-d1 relative w-full max-w-[300px] mx-auto overflow-hidden mb-[38px]" style={{ aspectRatio: '2/3' }}>
          <Image
            src="/images/alison4.png"
            alt="Alison Estevam — barbeiro e fundador"
            fill
            sizes="300px"
            className="object-cover object-top"
            priority
          />
        </div>

        <blockquote className="reveal reveal-d2 font-display font-semibold text-lg md:text-xl italic leading-[1.5] tracking-[0.02em] text-offwhite/90 mb-[38px] text-balance">
          &ldquo;O cuidado com os detalhes é o que separa o bom do excelente.&rdquo;
        </blockquote>

        <div
          className="reveal reveal-d3 flex flex-col gap-[10px] font-light text-[15px] leading-[1.3] tracking-[0.07em] text-offwhite/55 text-left md:text-center"
          style={{ fontFamily: 'var(--font-jost)' }}
        >
          <p>
            Sou barbeiro desde 2018. Comecei como funcionário em barbearias convencionais, e em 2024 decidi montar meu próprio espaço.
          </p>
          <p>
            Então venho construindo uma trajetória sólida e hoje ofereço um modelo de atendimento único: exclusivo, reservado e completamente focado em você.
          </p>
          <p>
            Tenho formação em visagismo e imagem masculina, e neste ano concluí um curso avançado de técnica com tesoura. Invisto em aprimorar o que já sei fazer bem.
          </p>
        </div>

        <div className="reveal reveal-d4 mt-[38px] flex justify-end">
          <Image
            src="/images/assinatura-dark.png"
            alt="Assinatura de Alison Estevam"
            width={176}
            height={117}
            priority
            className="theme-swap-dark w-[85px] h-auto"
          />
          <Image
            src="/images/assinatura-light.png"
            alt="Assinatura de Alison Estevam"
            width={183}
            height={115}
            priority
            className="theme-swap-light w-[85px] h-auto"
          />
        </div>
      </div>
    </section>
  )
}

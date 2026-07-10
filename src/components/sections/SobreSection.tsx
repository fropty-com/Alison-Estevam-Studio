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
          className="reveal font-display font-normal text-[clamp(22px,6vw,40px)] leading-[1.25] tracking-[0.05em] uppercase text-offwhite mb-[42px] whitespace-nowrap"
        >
          Precisão que vira<br />assinatura
        </h2>

        <div className="reveal reveal-d1 relative w-full max-w-[300px] mx-auto overflow-hidden mb-[38px]" style={{ aspectRatio: '3/4' }}>
          <Image
            src="/images/alison1.png"
            alt="Alison Estevam — barbeiro e fundador"
            fill
            sizes="300px"
            className="object-cover object-top grayscale"
            priority
          />
        </div>

        <blockquote className="reveal reveal-d2 font-display font-semibold text-lg md:text-xl italic leading-[1.5] tracking-[0.02em] text-offwhite/90 mb-[38px] text-balance">
          &ldquo;O cuidado com os detalhes é o que separa o bom do excelente.&rdquo;
        </blockquote>

        <div className="reveal reveal-d3 flex flex-col gap-[18px] font-body font-light text-[15px] leading-[1.9] tracking-[0.01em] text-offwhite/55 text-left md:text-center">
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

        <p
          className="reveal reveal-d4 font-display italic text-3xl text-offwhite/80 mt-[38px]"
          aria-hidden="true"
        >
          Alison
        </p>
        <span className="sr-only">Assinado por Alison Estevam</span>
      </div>
    </section>
  )
}

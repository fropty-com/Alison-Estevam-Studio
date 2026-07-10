import { SobreSection }        from '@/components/sections/SobreSection'
import { ServicosSection }      from '@/components/sections/ServicosSection'
import { CuidadosSection }      from '@/components/sections/CuidadosSection'
import { GaleriaSection }       from '@/components/sections/GaleriaSection'
import { DepoimentosSection }   from '@/components/sections/DepoimentosSection'
import { HomeHero }             from '@/components/sections/HomeHero'
import { RevealInit }           from '@/components/ui/RevealInit'
import type { Metadata }        from 'next'

export const metadata: Metadata = {
  // `absolute` bypasses the layout's `%s · Alison Estevam` template so the
  // homepage title matches the brief exactly, with no suffix.
  title: { absolute: 'Alison Estevam Studio | Barbearia em Salto/SP' },
  description: 'Atendimento exclusivo em barbearia, corte, barba, cuidados masculinos e horário reservado em Salto/SP.',
}

export default function HomePage() {
  return (
    <>
      <RevealInit />
      <HomeHero />
      <SobreSection />
      <GaleriaSection />
      <ServicosSection />
      <CuidadosSection />
      <DepoimentosSection />
    </>
  )
}

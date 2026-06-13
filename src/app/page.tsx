import { SobreSection }        from '@/components/sections/SobreSection'
import { ExperienciaSection }   from '@/components/sections/ExperienciaSection'
import { ServicosSection }      from '@/components/sections/ServicosSection'
import { GaleriaSection }       from '@/components/sections/GaleriaSection'
import { DepoimentosSection }   from '@/components/sections/DepoimentosSection'
import { ContatoSection }       from '@/components/sections/ContatoSection'
import { HomeHero }             from '@/components/sections/HomeHero'
import { RevealInit }           from '@/components/ui/RevealInit'
import type { Metadata }        from 'next'

export const metadata: Metadata = {
  title: 'Alison Estevam — Barbearia',
  description: 'Barbearia Alison Estevam — Atendimento exclusivo, um cliente por vez. Especialista em corte com tesoura, barba completa e Pixie Cut.',
}

export default function HomePage() {
  return (
    <>
      <RevealInit />
      <HomeHero />
      <SobreSection />
      <ServicosSection />
      <GaleriaSection />
      <ExperienciaSection />
      <DepoimentosSection />
      <ContatoSection />
    </>
  )
}

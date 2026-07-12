import type { Metadata } from 'next'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Licenças — Alison Estevam Studio' }

const h2Cls = 'font-body font-medium text-[10px] tracking-[0.32em] uppercase text-gold mt-10 mb-3'
const pCls  = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65 mb-3'
const liCls = 'font-body font-light text-[14px] leading-[1.75] text-offwhite/65'

const LIBRARIES: { name: string; license: string }[] = [
  { name: 'Next.js', license: 'MIT' },
  { name: 'React', license: 'MIT' },
  { name: 'Tailwind CSS', license: 'MIT' },
  { name: 'date-fns', license: 'MIT' },
  { name: 'Zod', license: 'MIT' },
  { name: 'Supabase JS', license: 'MIT' },
  { name: 'Resend', license: 'MIT' },
]

export default function LicencasPage() {
  return (
    <div className="px-6 pt-[110px] pb-24 lg:pt-[152px]">
      <div className="max-w-[680px] mx-auto">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/28 mb-2">
          {BRAND.fullName}
        </p>
        <h1 className="font-display font-light text-[34px] text-offwhite tracking-[0.02em] leading-tight mb-2">
          Licenças
        </h1>
        <p className="font-body font-light text-[11px] text-offwhite/30 tracking-[0.08em] mb-10">
          Última atualização: 12 de julho de 2026
        </p>

        <p className={pCls}>
          Este sistema é construído com bibliotecas de código aberto. Abaixo estão as principais,
          todas sob licenças permissivas que autorizam o uso comercial.
        </p>

        <h2 className={h2Cls}>Bibliotecas open-source</h2>
        <ul className="list-disc pl-5 space-y-2 mb-3">
          {LIBRARIES.map(lib => (
            <li key={lib.name} className={liCls}>{lib.name} — Licença {lib.license}</li>
          ))}
        </ul>

        <h2 className={h2Cls}>Imagens e ícones</h2>
        <p className={pCls}>
          Fotos do portfólio e retratos usados no site são de propriedade do {BRAND.fullName} ou
          licenciados para uso exclusivo. Ícones da interface são desenhados internamente ou
          derivados de conjuntos de licença aberta.
        </p>

        <p className="font-body font-light text-[10.5px] text-offwhite/25 tracking-[0.05em] mt-12 pt-6 border-t border-offwhite/8">
          Imagens temporárias ou de referência usadas durante o desenvolvimento devem ser
          substituídas por material autorizado antes da divulgação oficial do site.
        </p>
      </div>
    </div>
  )
}

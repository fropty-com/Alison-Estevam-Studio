import Link from 'next/link'
import { BRAND } from '@/config/brand'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 pt-[110px] pb-24 lg:pt-[95px]">
      <div className="max-w-[420px] text-center">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/55 mb-3">
          {BRAND.fullName}
        </p>
        <h1 className="font-display font-light text-[28px] text-offwhite tracking-[0.02em] leading-tight mb-3">
          Página não encontrada
        </h1>
        <p className="font-body font-light text-[13px] leading-[1.75] text-offwhite/55 mb-8">
          O endereço acessado não existe ou foi movido.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-[10px] font-body font-light text-[9px] tracking-[0.24em] uppercase text-charcoal bg-gold hover:bg-gold-light transition-colors duration-200"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}

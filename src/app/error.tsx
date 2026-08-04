'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BRAND } from '@/config/brand'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 pt-[110px] pb-24 lg:pt-[95px]">
      <div className="max-w-[420px] text-center">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-3">
          {BRAND.fullName}
        </p>
        <h1 className="font-display font-light text-[28px] text-offwhite tracking-[0.02em] leading-tight mb-3">
          Algo não saiu como esperado
        </h1>
        <p className="font-body font-light text-[13px] leading-[1.75] text-offwhite/50 mb-8">
          Encontramos um erro inesperado ao carregar esta página. Você pode tentar novamente
          ou voltar para o início.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-[10px] font-body font-light text-[9px] tracking-[0.24em] uppercase text-charcoal bg-gold hover:bg-gold-light transition-colors duration-200"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="px-5 py-[10px] font-body font-light text-[9px] tracking-[0.24em] uppercase text-offwhite/60 border border-offwhite/[0.15] hover:border-gold/35 hover:text-gold/[0.75] transition-all duration-200"
          >
            Início
          </Link>
        </div>
      </div>
    </div>
  )
}

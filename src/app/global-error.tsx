'use client'

import { useEffect } from 'react'
import '@/app/globals.css'

export default function GlobalError({
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
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-[420px] text-center">
            <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-3">
              Alison Estevam Studio
            </p>
            <h1 className="font-display font-light text-[28px] text-offwhite tracking-[0.02em] leading-tight mb-3">
              Algo não saiu como esperado
            </h1>
            <p className="font-body font-light text-[13px] leading-[1.75] text-offwhite/50 mb-8">
              Encontramos um erro inesperado. Tente novamente em instantes.
            </p>
            <button
              onClick={reset}
              className="px-5 py-[10px] font-body font-light text-[9px] tracking-[0.24em] uppercase text-charcoal bg-gold hover:bg-gold-light transition-colors duration-200"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

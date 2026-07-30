'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep hover:bg-gold-light transition-all duration-300"
    >
      Imprimir / Salvar PDF
    </button>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

interface ShippingRate {
  id: string
  label: string
  state: string | null
  price: number
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Custom listbox instead of a native <select> — the browser draws a native
 * <select> popup using OS chrome that `color-scheme` doesn't reliably
 * theme across browsers (confirmed still showing a white panel in a real
 * browser after that fix), so this renders its own panel with the site's
 * own colors, which can never mismatch the theme.
 */
export function ShippingRateSelect({
  rates,
  value,
  onChange,
}: {
  rates: ShippingRate[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selected = rates.find(r => r.id === value)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-offwhite/5 border border-offwhite/[0.12] text-left px-3 py-[10px] outline-none focus:border-gold/50 transition-colors"
      >
        <span className={`font-body font-light text-base ${selected ? 'text-offwhite' : 'text-offwhite/55'}`}>
          {selected ? `${selected.label}${selected.state ? ` (${selected.state})` : ''} — ${fmt(selected.price)}` : 'Selecione…'}
        </span>
        <span className={`text-offwhite/55 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 bg-charcoal border border-offwhite/[0.14] max-h-[240px] overflow-y-auto">
          {rates.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => { onChange(r.id); setOpen(false) }}
              className={`w-full text-left px-3 py-[10px] font-body font-light text-[13px] transition-colors ${
                r.id === value ? 'bg-gold/10 text-gold' : 'text-offwhite/70 hover:bg-offwhite/5 hover:text-offwhite'
              }`}
            >
              {r.label}{r.state ? ` (${r.state})` : ''} — {fmt(r.price)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

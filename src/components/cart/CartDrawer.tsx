'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useCart } from '@/lib/cart/CartContext'

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function CartDrawer() {
  const { items, isOpen, close, removeItem, setQuantity, subtotal } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    close()
    router.push('/checkout')
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[300] transition-opacity duration-300',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      )}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-charcoal-deep/70" onClick={close} />

      <div
        role="dialog"
        aria-label="Carrinho de compras"
        className={cn(
          'absolute top-0 right-0 h-full w-full max-w-[420px] bg-charcoal border-l border-offwhite/10',
          'flex flex-col transition-transform duration-300 ease-brand-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-offwhite/[0.07]">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35">
            Carrinho {items.length > 0 && `(${items.length})`}
          </p>
          <button
            onClick={close}
            aria-label="Fechar carrinho"
            className="w-[32px] h-[32px] flex items-center justify-center text-offwhite/40 hover:text-offwhite transition-colors border border-offwhite/[0.12] hover:border-offwhite/30"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <p className="font-body font-light text-[12px] text-offwhite/25 italic text-center py-16">
              Seu carrinho está vazio.
            </p>
          ) : (
            <div className="divide-y divide-offwhite/[0.07]">
              {items.map(item => (
                <div key={item.productId} className="flex gap-4 px-6 py-5">
                  <div className="w-[64px] h-[80px] shrink-0 bg-offwhite/[0.03] overflow-hidden">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-normal text-sm text-offwhite leading-tight mb-1 truncate">{item.name}</p>
                    <p className="font-data italic text-sm text-gold mb-3">{fmt(item.price)}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-offwhite/[0.14]">
                        <button
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-[26px] h-[26px] flex items-center justify-center text-offwhite/50 hover:text-offwhite disabled:opacity-30 transition-colors"
                          aria-label="Diminuir quantidade"
                        >
                          −
                        </button>
                        <span className="w-[28px] text-center font-body font-light text-[12px] text-offwhite">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.stockQuantity}
                          className="w-[26px] h-[26px] flex items-center justify-center text-offwhite/50 hover:text-offwhite disabled:opacity-30 transition-colors"
                          aria-label="Aumentar quantidade"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="font-body font-light text-[9px] tracking-[0.15em] uppercase text-offwhite/25 hover:text-error/70 transition-colors"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-offwhite/[0.07] px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-body font-light text-[10px] tracking-[0.15em] uppercase text-offwhite/40">Subtotal</span>
              <span className="font-data italic text-lg text-gold">{fmt(subtotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full px-6 py-[13px] font-body font-medium text-[10px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light"
            >
              Finalizar compra
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

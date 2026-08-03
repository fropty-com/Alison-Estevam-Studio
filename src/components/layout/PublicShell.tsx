'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Nav }           from './Nav'
import { Footer }        from './Footer'
import { FloatingWhatsapp } from './FloatingWhatsapp'
import { CartProvider } from '@/lib/cart/CartContext'
import { CartDrawer } from '@/components/cart/CartDrawer'

function ThemeInit() {
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])
  return null
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const isAdmin   = pathname.startsWith('/admin')
  const isFocused = ['/agendar', '/entrar', '/conta', '/perfil', '/reagendar', '/cancelar', '/confirmar', '/checkout', '/pedido'].some(p => pathname.startsWith(p))

  if (isAdmin) return <>{children}</>

  // Agendamento, login e área do cliente são fluxos focados, de tela
  // cheia — sem nav/footer do site, matching o prototipo de referencia.
  if (isFocused) {
    return (
      <CartProvider>
        <ThemeInit />
        <main>{children}</main>
        <FloatingWhatsapp />
      </CartProvider>
    )
  }

  return (
    <CartProvider>
      <ThemeInit />
      <Nav />
      <main>{children}</main>
      <Footer />
      <FloatingWhatsapp />
      <CartDrawer />
    </CartProvider>
  )
}

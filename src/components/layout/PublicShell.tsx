'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Nav }           from './Nav'
import { Footer }        from './Footer'
import { FloatingWhatsapp } from './FloatingWhatsapp'
import { CartProvider } from '@/lib/cart/CartContext'
import { CartDrawer } from '@/components/cart/CartDrawer'
import { SkipLink } from '@/components/ui/SkipLink'

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
  const pathname    = usePathname()
  const isAdmin     = pathname.startsWith('/admin')
  const isFocused   = ['/agendar', '/entrar', '/conta', '/perfil', '/reagendar', '/cancelar', '/confirmar', '/checkout', '/pedido'].some(p => pathname.startsWith(p))
  // Área logada do cliente (dashboard + perfil) já tem seus próprios canais
  // de contato/ajuda na topbar — o botão flutuante de WhatsApp só faz
  // sentido nos fluxos de agendamento/checkout, onde ainda não há chrome.
  const isClientArea = pathname.startsWith('/conta') || pathname.startsWith('/perfil')

  if (isAdmin) return <>{children}</>

  // Agendamento, login e área do cliente são fluxos focados, de tela
  // cheia — sem nav/footer do site, matching o prototipo de referencia.
  if (isFocused) {
    return (
      <CartProvider>
        <ThemeInit />
        <SkipLink />
        <main id="main-content">{children}</main>
        {!isClientArea && <FloatingWhatsapp />}
      </CartProvider>
    )
  }

  return (
    <CartProvider>
      <ThemeInit />
      <SkipLink />
      <Nav />
      <main id="main-content">{children}</main>
      <Footer />
      <FloatingWhatsapp />
      <CartDrawer />
    </CartProvider>
  )
}

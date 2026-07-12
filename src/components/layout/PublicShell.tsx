'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Nav }           from './Nav'
import { Footer }        from './Footer'
import { FloatingWhatsapp } from './FloatingWhatsapp'

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
  const isFocused = pathname.startsWith('/agendar') || pathname.startsWith('/entrar') || pathname.startsWith('/conta') || pathname.startsWith('/perfil')

  if (isAdmin) return <>{children}</>

  // Agendamento, login e área do cliente são fluxos focados, de tela
  // cheia — sem nav/footer do site, matching o prototipo de referencia.
  if (isFocused) {
    return (
      <>
        <ThemeInit />
        <main>{children}</main>
        <FloatingWhatsapp />
      </>
    )
  }

  return (
    <>
      <ThemeInit />
      <Nav />
      <main>{children}</main>
      <Footer />
      <FloatingWhatsapp />
    </>
  )
}

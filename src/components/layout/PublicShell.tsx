'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Nav }           from './Nav'
import { Footer }        from './Footer'
import { FloatingWhatsapp } from './FloatingWhatsapp'
import { ThemeToggle }   from '@/components/ui/ThemeToggle'

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
        <div className="fixed top-[36px] inset-x-0 z-[400] pointer-events-none">
          <div className="max-w-[560px] mx-auto px-8 flex justify-end">
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>
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

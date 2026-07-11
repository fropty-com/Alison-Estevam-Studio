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
  const isAgendar = pathname.startsWith('/agendar')

  if (isAdmin) return <>{children}</>

  // Agendamento is its own focused, full-page flow — no site nav/footer,
  // matching the reference prototype's dedicated booking screens.
  if (isAgendar) {
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

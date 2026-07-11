'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Nav }           from './Nav'
import { NavScheduleBtn } from './NavScheduleBtn'
import { Footer }        from './Footer'
import { FloatingWhatsapp } from './FloatingWhatsapp'
import { BookingProvider } from '@/components/booking/BookingProvider'

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
  const pathname = usePathname()
  const isAdmin  = pathname.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <BookingProvider>
      <ThemeInit />
      <Nav />
      <NavScheduleBtn />
      <main>{children}</main>
      <Footer />
      <FloatingWhatsapp />
    </BookingProvider>
  )
}

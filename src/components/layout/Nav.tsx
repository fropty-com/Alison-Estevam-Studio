'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AuthModal } from '@/components/ui/AuthModal'

const NAV_LINKS = [
  { href: '#sobre',       label: 'Sobre',       section: 'sobre' },
  { href: '#experiencia', label: 'Experiência',  section: 'experiencia' },
  { href: '#servicos',    label: 'Serviços',     section: 'servicos' },
  { href: '#vip',         label: 'VIP',          section: 'vip' },
] as const

function openBooking() {
  window.dispatchEvent(new Event('open-booking'))
}

export function Nav() {
  const [scrolled,      setScrolled]  = useState(false)
  const [activeSection, setActive]    = useState('')
  const [menuOpen,      setMenuOpen]  = useState(false)
  const [authOpen,      setAuthOpen]  = useState(false)

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 55)
    let current = ''
    NAV_LINKS.forEach(({ section }) => {
      const el = document.getElementById(section)
      if (el && window.scrollY >= el.offsetTop - 130) current = section
    })
    setActive(current)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && menuOpen) setMenuOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
      <nav
        role="navigation"
        aria-label="Navegação principal"
        className={cn(
          'fixed top-0 left-0 right-0 z-[200]',
          'grid grid-cols-[1fr_auto_1fr] items-center',
          'px-6 py-7 md:px-[60px]',
          'transition-all duration-500 ease-brand-circ',
          scrolled && 'bg-charcoal-deep/97 backdrop-blur-brand py-[15px] shadow-[0_1px_0_rgba(245,240,232,0.05)]'
        )}
      >
        {/* Left */}
        <Link
          href="/"
          aria-label={`${BRAND.name} — Início`}
          className="font-body font-light text-2xs tracking-label uppercase text-offwhite/40 hover:text-offwhite/72 transition-colors leading-[1.3]"
        >
          Escolha o seu momento
        </Link>

        {/* Center — always truly centered */}
        <ul className="hidden md:flex gap-10 list-none" role="list">
          {NAV_LINKS.map(({ href, label, section }) => (
            <li key={section}>
              <a
                href={href}
                className={cn(
                  'font-body font-light text-2xs tracking-nav uppercase relative pb-[3px] transition-colors duration-300',
                  'after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:h-px after:bg-gold',
                  'after:transition-[width] after:duration-300 after:ease-brand-out',
                  activeSection === section
                    ? 'text-offwhite after:w-full'
                    : 'text-offwhite/52 after:w-0 hover:text-offwhite hover:after:w-full'
                )}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right */}
        <div className="flex items-center gap-4 justify-end">
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={() => setAuthOpen(true)}
              aria-label="Entrar na conta"
              className="font-body font-light text-2xs tracking-nav uppercase text-offwhite/50 hover:text-offwhite/85 transition-colors duration-250 px-1"
            >
              Entrar
            </button>
            <button
              onClick={openBooking}
              aria-label="Agendar horário"
              className="font-body font-light text-2xs tracking-nav uppercase text-charcoal-deep bg-gold px-6 py-[11px] transition-all duration-300 ease-brand-out hover:bg-gold-light hover:shadow-[0_8px_24px_rgba(201,169,110,0.32)] hover:-translate-y-px active:translate-y-0"
            >
              Agendar
            </button>
          </div>
          {/* Mobile: theme toggle + hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              className="flex flex-col gap-[5px] bg-transparent border-none p-1 w-7"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              <span className={cn('block w-full h-px bg-offwhite/55 transition-transform duration-300 origin-center', menuOpen && 'translate-y-[6px] rotate-45')} />
              <span className={cn('block w-full h-px bg-offwhite/55 transition-opacity duration-300', menuOpen && 'opacity-0')} />
              <span className={cn('block w-full h-px bg-offwhite/55 transition-transform duration-300 origin-center', menuOpen && '-translate-y-[6px] -rotate-45')} />
            </button>
          </div>
        </div>
      </nav>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* Mobile drawer */}
      <div
        role="dialog"
        aria-label="Menu"
        className={cn(
          'fixed inset-0 z-[190] flex flex-col items-center justify-center gap-7',
          'bg-charcoal-deep/98 backdrop-blur-[20px]',
          'transition-opacity duration-400 ease-brand-out',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={label}
            href={href}
            onClick={() => setMenuOpen(false)}
            className="font-body font-light text-sm tracking-[0.45em] uppercase text-offwhite/45 hover:text-offwhite transition-colors duration-300"
          >
            {label}
          </a>
        ))}

        {/* Divider */}
        <div className="w-[32px] h-px bg-gold/30 my-1" aria-hidden="true" />

        {/* Primary CTA */}
        <button
          onClick={() => { setMenuOpen(false); openBooking() }}
          className="font-body font-light text-2xs tracking-[0.4em] uppercase text-charcoal-deep bg-gold px-10 py-[14px] hover:bg-gold-light transition-colors duration-300"
        >
          Agendar
        </button>
        <button
          onClick={() => { setMenuOpen(false); setAuthOpen(true) }}
          className="font-body font-light text-2xs tracking-[0.4em] uppercase text-offwhite/50 border border-offwhite/18 px-10 py-[13px] hover:text-offwhite hover:border-offwhite/40 transition-colors duration-300"
        >
          Entrar
        </button>
      </div>
    </>
  )
}

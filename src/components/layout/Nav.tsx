'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BRAND } from '@/config/brand'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useCart } from '@/lib/cart/CartContext'

const NAV_LINKS = [
  { href: '#sobre',       label: 'Sobre',             section: 'sobre' },
  { href: '#portfolio',   label: 'Portfólio',         section: 'portfolio' },
  { href: '#servicos',    label: 'Serviços',          section: 'servicos' },
  { href: '#cuidados',    label: 'Cuidados',          section: 'cuidados' },
  { href: '#depoimentos', label: 'Depoimentos',       section: 'depoimentos' },
  { href: '#contato',     label: 'Como Chegar',       section: 'contato' },
] as const

function CartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <path d="M4 5.5h9l-.8 7.2a1 1 0 0 1-1 .9H5.8a1 1 0 0 1-1-.9L4 5.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M6 5.5V4a2.5 2.5 0 0 1 5 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function CartButton({ className }: { className?: string }) {
  const { itemCount, open } = useCart()
  return (
    <button
      onClick={open}
      aria-label={`Abrir carrinho${itemCount > 0 ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'itens'})` : ''}`}
      className={cn('relative text-offwhite/50 hover:text-offwhite/85 transition-colors duration-250', className)}
    >
      <CartIcon />
      {itemCount > 0 && (
        <span className="absolute -top-[7px] -right-[9px] min-w-[16px] h-[16px] px-[3px] flex items-center justify-center bg-gold text-charcoal-deep font-body font-medium text-[8.5px] leading-none rounded-full">
          {itemCount}
        </span>
      )}
    </button>
  )
}

export function Nav() {
  const router = useRouter()
  const openBooking = useCallback(() => router.push('/agendar'), [router])
  const [activeSection, setActive]    = useState('')
  const [menuOpen,      setMenuOpen]  = useState(false)

  const handleScroll = useCallback(() => {
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
      {/* ── Mobile: thin bordered topbar ── */}
      <nav
        role="navigation"
        aria-label="Navegação principal"
        className="lg:hidden sticky top-0 z-[200] mx-3 mt-3 flex items-center justify-between
                   border border-offwhite/[0.18] bg-charcoal/95 backdrop-blur-brand px-4 py-[8px]"
      >
        <button
          className="flex flex-col gap-[6px] bg-transparent border-none p-1 w-6"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          <span className={cn('block w-full h-px bg-offwhite/70 transition-transform duration-300 origin-center', menuOpen && 'translate-y-[3.5px] rotate-45')} />
          <span className={cn('block w-full h-px bg-offwhite/70 transition-transform duration-300 origin-center', menuOpen && '-translate-y-[3.5px] -rotate-45')} />
        </button>

        <div className="flex items-center gap-4">
          <CartButton />
          <button
            onClick={openBooking}
            aria-label="Agendar horário"
            className="font-body font-medium text-2xs tracking-nav uppercase bg-offwhite text-charcoal px-4 py-[6px]"
          >
            Agendar
          </button>
        </div>
      </nav>

      {/* ── Desktop: full nav ── */}
      <nav
        role="navigation"
        aria-label="Navegação principal (desktop)"
        className="hidden lg:block fixed top-0 left-0 right-0 z-[200] bg-charcoal border-b border-offwhite/[0.08]"
      >
      <div className="max-w-[1400px] mx-auto grid grid-cols-[1fr_auto_1fr] gap-6 items-center px-8 xl:px-[60px] py-6">
        <Link
          href="/"
          aria-label={`${BRAND.name} — Início`}
          className="font-display font-normal text-lg tracking-[0.08em] uppercase text-offwhite/85 hover:text-offwhite transition-colors leading-none justify-self-start whitespace-nowrap"
        >
          Alison Estevam
        </Link>

        <ul className="flex gap-5 xl:gap-8 list-none whitespace-nowrap" role="list">
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
                    : 'text-offwhite/[0.52] after:w-0 hover:text-offwhite hover:after:w-full'
                )}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 justify-self-end">
          <ThemeToggle />
          <Link
            href="/produtos"
            aria-label="Ver produtos"
            className="font-body font-light text-2xs tracking-nav uppercase text-offwhite/50 hover:text-offwhite/85 transition-colors duration-250 px-1"
          >
            Produtos
          </Link>
          <CartButton />
          <Link
            href="/entrar"
            aria-label="Entrar na conta"
            className="font-body font-light text-2xs tracking-nav uppercase text-offwhite/50 hover:text-offwhite/85 transition-colors duration-250 px-1"
          >
            Entrar
          </Link>
          <button
            onClick={openBooking}
            aria-label="Agendar horário"
            className="font-body font-medium text-2xs tracking-nav uppercase text-charcoal-deep bg-gold px-6 py-[11px] transition-all duration-300 ease-brand-out hover:bg-gold-light hover:shadow-[0_8px_24px_rgba(203,163,57,0.32)] hover:-translate-y-px active:translate-y-0"
          >
            Agendar
          </button>
        </div>
      </div>
      </nav>

      {/* Mobile drawer */}
      <div
        role="dialog"
        aria-label="Menu"
        className={cn(
          'lg:hidden fixed inset-0 z-[190] flex flex-col items-center justify-center gap-4',
          'bg-charcoal/95 backdrop-blur-[20px]',
          'transition-opacity duration-400 ease-brand-out',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {NAV_LINKS.map(({ href, label }) => (
          <a
            key={label}
            href={href}
            onClick={() => setMenuOpen(false)}
            className="font-body font-light text-sm tracking-[0.4em] uppercase text-offwhite/55 hover:text-offwhite transition-colors duration-300"
          >
            {label}
          </a>
        ))}

        <div className="w-[32px] h-px bg-gold/30 my-1" aria-hidden="true" />

        <button
          onClick={() => { setMenuOpen(false); openBooking() }}
          className="font-body font-medium text-2xs tracking-[0.4em] uppercase text-charcoal-deep bg-gold px-10 py-[14px] hover:bg-gold-light transition-colors duration-300"
        >
          Agendar
        </button>
        <Link
          href="/produtos"
          onClick={() => setMenuOpen(false)}
          className="font-body font-light text-2xs tracking-[0.4em] uppercase text-offwhite/50 border border-offwhite/[0.18] px-10 py-[13px] hover:text-offwhite hover:border-offwhite/40 transition-colors duration-300 text-center"
        >
          Produtos
        </Link>
        <Link
          href="/entrar"
          onClick={() => setMenuOpen(false)}
          className="font-body font-light text-2xs tracking-[0.4em] uppercase text-offwhite/50 border border-offwhite/[0.18] px-10 py-[13px] hover:text-offwhite hover:border-offwhite/40 transition-colors duration-300 text-center"
        >
          Entrar
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { PendingBadge } from './PendingBadge'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { useModalA11y } from '@/lib/hooks/useModalA11y'
import type { Dictionary } from '@/lib/i18n/getDictionary'

function DashboardIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.1" /><rect x="8.5" y="1.5" width="5" height="5" stroke="currentColor" strokeWidth="1.1" /><rect x="1.5" y="8.5" width="5" height="5" stroke="currentColor" strokeWidth="1.1" /><rect x="8.5" y="8.5" width="5" height="5" stroke="currentColor" strokeWidth="1.1" /></svg>
}
function AgendaIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><rect x="1.5" y="2.5" width="12" height="11" stroke="currentColor" strokeWidth="1.1" /><line x1="1.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="1.1" /><line x1="4" y1="1" x2="4" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
}
function WaitlistIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" /><path d="M7.5 4v3.7l2.5 1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function ClientsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="5.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.1" /><path d="M1.5 13c0-2.5 1.8-4 4-4s4 1.5 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><circle cx="11" cy="5.5" r="1.7" stroke="currentColor" strokeWidth="1" /><path d="M10 8.7c1.7.1 2.9 1.3 3 3.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
}
function ServicesIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="4.5" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.1" /><circle cx="4.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.1" /><line x1="12.5" y1="4.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><line x1="6" y1="4.5" x2="12.5" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
}
function ProductsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="6" y="1.5" width="3" height="1.8" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.5 3.3h4v1.6l1.3 2v6.1a1 1 0 0 1-1 1H5.2a1 1 0 0 1-1-1V6.9l1.3-2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <line x1="4.5" y1="9" x2="10.5" y2="9" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}
function ReportsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><line x1="2.5" y1="13" x2="12.5" y2="13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><rect x="3" y="8" width="2.4" height="5" stroke="currentColor" strokeWidth="1" /><rect x="6.3" y="5" width="2.4" height="8" stroke="currentColor" strokeWidth="1" /><rect x="9.6" y="2" width="2.4" height="11" stroke="currentColor" strokeWidth="1" /></svg>
}
function FinanceIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.1" /><path d="M9.3 5.3c-.4-.5-1.1-.8-1.8-.8-1.2 0-2.1.8-2.1 1.8s.9 1.5 2.1 1.8c1.2.3 2.1.8 2.1 1.8s-.9 1.8-2.1 1.8c-.7 0-1.4-.3-1.8-.8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><line x1="7.5" y1="3" x2="7.5" y2="4.3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><line x1="7.5" y1="10.7" x2="7.5" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
}
function ExportIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M4.5 2h4l3 3v8h-7V2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><path d="M8.5 2v3h3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><path d="M6 8.5v3.5M4.3 10.2 6 8.5l1.7 1.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function OperationalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      {[1.5, 6, 10.5].flatMap((y, i) =>
        [1.5, 6, 10.5].map((x, j) => (
          <rect key={`${i}-${j}`} x={x} y={y} width="3" height="3" fill="currentColor" opacity={i === 1 && j === 1 ? 1 : 0.35} />
        ))
      )}
    </svg>
  )
}
function ActivityIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M1.5 8h2.5l1.5-4.5 2.5 9 1.5-4.5H13.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" /></svg>
}
function SettingsIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={cn('transition-transform', dir === 'right' && 'rotate-180')}>
      <path d="M7.5 2.5 3.5 6l4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function MenuIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><line x1="2" y1="4.5" x2="14" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><line x1="2" y1="11.5" x2="14" y2="11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
}

function getNav(t: Dictionary) {
  return [
    { href: '/admin',               label: t.nav.dashboard,   Icon: DashboardIcon, badge: true,  ownerOnly: false },
    { href: '/admin/agenda',        label: t.nav.agenda,      Icon: AgendaIcon,    badge: false, ownerOnly: false },
    { href: '/admin/espera',        label: t.nav.waitlist,    Icon: WaitlistIcon,  badge: false, ownerOnly: false },
    { href: '/admin/clientes',      label: t.nav.clients,     Icon: ClientsIcon,   badge: false, ownerOnly: false },
    { href: '/admin/servicos',      label: t.nav.services,    Icon: ServicesIcon,  badge: false, ownerOnly: false },
    { href: '/admin/produtos',      label: t.nav.products,    Icon: ProductsIcon,  badge: false, ownerOnly: false },
    { href: '/admin/faturamento',   label: t.nav.billing,     Icon: ReportsIcon,   badge: false, ownerOnly: true  },
    { href: '/admin/financeiro',    label: t.nav.finance,     Icon: FinanceIcon,   badge: false, ownerOnly: true  },
    { href: '/admin/operacional',   label: t.nav.operational, Icon: OperationalIcon, badge: false, ownerOnly: true },
    { href: '/admin/relatorios',    label: t.nav.reports,     Icon: ExportIcon,    badge: false, ownerOnly: true  },
    { href: '/admin/atividade',     label: t.nav.activity,    Icon: ActivityIcon,  badge: false, ownerOnly: true  },
    { href: '/admin/configuracoes', label: t.nav.settings,    Icon: SettingsIcon,  badge: false, ownerOnly: true  },
  ]
}

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const { t } = useTranslation()
  const NAV = getNav(t)
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const asideRef = useModalA11y(() => setMobileOpen(false), mobileOpen)

  useEffect(() => {
    setCollapsed(localStorage.getItem('admin-nav-collapsed') === 'true')
    setMounted(true)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = () => {
    setCollapsed(c => {
      localStorage.setItem('admin-nav-collapsed', String(!c))
      return !c
    })
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const visibleNav = NAV.filter(item => !item.ownerOnly || isOwner)

  return (
    <>
      {/* Mobile hamburger — hidden from md: up, since the sidebar itself
          becomes persistent (compact) there instead of a drawer. */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label={t.nav.openMenu}
        className="md:hidden fixed top-4 left-4 z-40 w-[36px] h-[36px] flex items-center justify-center bg-charcoal-mid border border-offwhite/[0.12] text-offwhite/70 print:hidden"
      >
        <MenuIcon />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-charcoal-deep/70"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        ref={asideRef}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? true : undefined}
        aria-label={mobileOpen ? t.nav.openMenu : undefined}
        className={cn(
          'shrink-0 bg-charcoal-mid border-r border-offwhite/[0.06] flex flex-col min-h-screen print:hidden outline-none',
          // Persistent (not a hamburger drawer) from md: up — a tablet in a
          // barbershop reception has the horizontal room for it, unlike a
          // phone. It renders compact there regardless of the desktop
          // collapse preference (see the width/inner-content overrides
          // below); only lg: honors that preference.
          'fixed md:sticky top-0 z-50 md:z-auto',
          // Only `transform` transitions — animating `width` on a
          // `position: sticky` element makes Chromium fail to recompute the
          // element's box size on the collapse/expand toggle, leaving it
          // visually stuck at the old width while its children render the
          // new (collapsed/expanded) layout, a real mismatched-size bug.
          mounted ? 'transition-transform duration-200' : '',
          collapsed ? 'w-[64px]' : 'w-[220px] md:w-[64px] lg:w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Brand + collapse toggle — a single row matching the topbar's
            height so the sidebar and content borders line up exactly. */}
        <div className={cn(
          'relative flex items-center h-[56px] border-b border-offwhite/[0.06] shrink-0 overflow-hidden',
          collapsed ? 'justify-center gap-[6px] px-2' : 'justify-center px-4 md:gap-[6px] md:px-2 lg:gap-0 lg:px-4'
        )}>
          <Link
            href="/admin"
            className="font-display font-normal uppercase text-offwhite/85 hover:text-offwhite transition-colors whitespace-nowrap"
          >
            <span className={cn('text-[14px] tracking-[0.08em]', collapsed ? 'hidden' : 'md:hidden lg:inline')}>Alison Estevam</span>
            <span className={cn('text-[13px] tracking-[0.05em]', collapsed ? 'inline' : 'hidden md:inline lg:hidden')}>AE</span>
          </Link>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? t.nav.expand : t.nav.collapse}
            className={cn(
              'shrink-0 w-[20px] h-[20px] items-center justify-center text-offwhite/55 hover:text-gold hover:bg-offwhite/5 transition-colors duration-200',
              collapsed ? 'flex' : 'flex absolute right-3 top-1/2 -translate-y-1/2 md:hidden lg:flex'
            )}
          >
            <ChevronIcon dir={collapsed ? 'right' : 'left'} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5 px-3">
          {visibleNav.map(({ href, label, Icon, badge }) => (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                'flex items-center gap-3 px-3 py-[10px] mb-[2px] rounded-none',
                'font-body font-light text-[10px] tracking-[0.28em] uppercase',
                'transition-all duration-200',
                collapsed ? 'justify-center px-0' : 'md:justify-center md:px-0 lg:justify-start lg:px-3',
                isActive(href)
                  ? 'bg-gold/15 text-gold-light border-l-[2px] border-gold pl-[10px]'
                  : 'text-offwhite/55 hover:text-offwhite/70 hover:bg-offwhite/5 border-l-[2px] border-transparent pl-[10px]',
                collapsed ? 'border-l-0 pl-0' : 'md:border-l-0 md:pl-0 lg:border-l-[2px] lg:pl-[10px]'
              )}
            >
              <span className="shrink-0"><Icon /></span>
              <span className={cn('flex-1', collapsed ? 'hidden' : 'md:hidden lg:block')}>{label}</span>
              {badge && <span className={cn(collapsed ? 'hidden' : 'md:hidden lg:inline-block')}><PendingBadge /></span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}

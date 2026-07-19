'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/admin/actions'
import { PendingBadge } from './PendingBadge'

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
function ReportsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><line x1="2.5" y1="13" x2="12.5" y2="13" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /><rect x="3" y="8" width="2.4" height="5" stroke="currentColor" strokeWidth="1" /><rect x="6.3" y="5" width="2.4" height="8" stroke="currentColor" strokeWidth="1" /><rect x="9.6" y="2" width="2.4" height="11" stroke="currentColor" strokeWidth="1" /></svg>
}
function AuditIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><rect x="2.5" y="1.5" width="10" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.1" /><line x1="4.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><line x1="4.5" y1="7.7" x2="10.5" y2="7.7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /><line x1="4.5" y1="10.4" x2="8.5" y2="10.4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
}
function SettingsIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><circle cx="7.5" cy="7.5" r="2.3" stroke="currentColor" strokeWidth="1.1" /><path d="M7.5 1.5v1.6M7.5 12v1.6M13.5 7.5h-1.6M3.2 7.5H1.5M11.6 3.4l-1.1 1.1M4.6 10.6l-1.1 1.1M11.6 11.7l-1.1-1.1M4.6 4.5 3.5 3.4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" /></svg>
}
function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={cn('transition-transform', dir === 'right' && 'rotate-180')}>
      <path d="M7.5 2.5 3.5 6l4 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function MenuIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><line x1="2" y1="4.5" x2="14" y2="4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><line x1="2" y1="11.5" x2="14" y2="11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
}

const NAV = [
  { href: '/admin',               label: 'Dashboard',     Icon: DashboardIcon, badge: true,  ownerOnly: false },
  { href: '/admin/agenda',        label: 'Agenda',        Icon: AgendaIcon,    badge: false, ownerOnly: false },
  { href: '/admin/espera',        label: 'Fila de Espera', Icon: WaitlistIcon, badge: false, ownerOnly: false },
  { href: '/admin/clientes',      label: 'Clientes',      Icon: ClientsIcon,   badge: false, ownerOnly: false },
  { href: '/admin/servicos',      label: 'Serviços',      Icon: ServicesIcon,  badge: false, ownerOnly: false },
  { href: '/admin/relatorios',    label: 'Relatórios',    Icon: ReportsIcon,   badge: false, ownerOnly: true  },
  { href: '/admin/auditoria',     label: 'Auditoria',     Icon: AuditIcon,     badge: false, ownerOnly: true  },
  { href: '/admin/configuracoes', label: 'Configurações', Icon: SettingsIcon,  badge: false, ownerOnly: true  },
]

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

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
      {/* Mobile hamburger — always mounted so the drawer can be reopened */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden fixed top-4 left-4 z-40 w-[36px] h-[36px] flex items-center justify-center bg-charcoal-mid border border-offwhite/12 text-offwhite/70"
      >
        <MenuIcon />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-charcoal-deep/70"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'shrink-0 bg-charcoal-mid border-r border-offwhite/6 flex flex-col min-h-screen',
          'fixed lg:sticky top-0 z-50 lg:z-auto',
          mounted ? 'transition-[width,transform] duration-200' : '',
          collapsed ? 'lg:w-[64px]' : 'lg:w-[220px]',
          'w-[220px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div className={cn('border-b border-offwhite/6', collapsed ? 'lg:px-3 lg:py-5 px-6 py-7' : 'px-6 py-7')}>
          <p className={cn('font-body font-light text-[8px] tracking-[0.48em] uppercase text-offwhite/28 mb-1', collapsed && 'lg:hidden')}>
            Studio
          </p>
          <p className={cn('font-display font-light text-[15px] text-offwhite tracking-[0.06em] mb-2', collapsed && 'lg:hidden')}>
            Alison Estevam
          </p>
          <span className={cn(
            'inline-block font-body font-light text-[7.5px] tracking-[0.2em] uppercase px-2 py-[3px] border',
            collapsed && 'lg:hidden',
            isOwner ? 'border-gold/30 text-gold/80' : 'border-offwhite/15 text-offwhite/40'
          )}>
            {isOwner ? 'Dono' : 'Equipe'}
          </span>
          {collapsed && (
            <p className="hidden lg:block font-display font-light text-[18px] text-gold text-center">A</p>
          )}
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
                collapsed && 'lg:justify-center lg:px-0',
                isActive(href)
                  ? 'bg-sage/12 text-sage-light border-l-[2px] border-sage pl-[10px]'
                  : 'text-offwhite/35 hover:text-offwhite/70 hover:bg-offwhite/4 border-l-[2px] border-transparent pl-[10px]',
                collapsed && 'lg:border-l-0 lg:pl-0'
              )}
            >
              <span className="shrink-0"><Icon /></span>
              <span className={cn('flex-1', collapsed && 'lg:hidden')}>{label}</span>
              {badge && <span className={cn(collapsed && 'lg:hidden')}><PendingBadge /></span>}
            </Link>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menu' : 'Encolher menu'}
          className="hidden lg:flex items-center justify-center gap-2 mx-3 mb-3 h-8 border border-offwhite/8 text-offwhite/30 hover:text-gold hover:border-gold/30 transition-colors duration-200"
        >
          <ChevronIcon dir={collapsed ? 'right' : 'left'} />
          {!collapsed && <span className="font-body font-light text-[8px] tracking-[0.2em] uppercase">Encolher</span>}
        </button>

        {/* Logout */}
        <div className="p-4 border-t border-offwhite/6">
          <button
            onClick={() => startTransition(() => logoutAction())}
            disabled={pending}
            title="Sair"
            className={cn(
              'w-full text-left px-3 py-[10px] font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/22 hover:text-offwhite/55 transition-colors duration-200 disabled:opacity-40',
              collapsed && 'lg:text-center lg:px-0'
            )}
          >
            {collapsed ? <span className="hidden lg:inline">→</span> : null}
            <span className={collapsed ? 'lg:hidden' : ''}>{pending ? 'Saindo…' : '→ Sair'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

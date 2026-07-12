'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/admin/actions'
import { useTransition } from 'react'
import { PendingBadge } from './PendingBadge'

const NAV = [
  { href: '/admin',               label: 'Dashboard',     icon: '◈', badge: true,  ownerOnly: false },
  { href: '/admin/agenda',        label: 'Agenda',        icon: '◷', badge: false, ownerOnly: false },
  { href: '/admin/espera',        label: 'Fila de Espera', icon: '◔', badge: false, ownerOnly: false },
  { href: '/admin/clientes',      label: 'Clientes',      icon: '◻', badge: false, ownerOnly: false },
  { href: '/admin/servicos',      label: 'Serviços',      icon: '◇', badge: false, ownerOnly: false },
  { href: '/admin/relatorios',    label: 'Relatórios',    icon: '◎', badge: false, ownerOnly: true  },
  { href: '/admin/auditoria',     label: 'Auditoria',     icon: '☰', badge: false, ownerOnly: true  },
  { href: '/admin/configuracoes', label: 'Configurações', icon: '⊞', badge: false, ownerOnly: true  },
]

export function AdminNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const visibleNav = NAV.filter(item => !item.ownerOnly || isOwner)

  return (
    <aside className="w-[220px] shrink-0 bg-charcoal-mid border-r border-offwhite/6 flex flex-col min-h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 py-7 border-b border-offwhite/6">
        <p className="font-body font-light text-[8px] tracking-[0.48em] uppercase text-offwhite/28 mb-1">
          Studio
        </p>
        <p className="font-display font-light text-[15px] text-offwhite tracking-[0.06em] mb-2">
          Alison Estevam
        </p>
        <span className={cn(
          'inline-block font-body font-light text-[7.5px] tracking-[0.2em] uppercase px-2 py-[3px] border',
          isOwner ? 'border-gold/30 text-gold/80' : 'border-offwhite/15 text-offwhite/40'
        )}>
          {isOwner ? 'Dono' : 'Equipe'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3">
        {visibleNav.map(({ href, label, icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-[10px] mb-[2px] rounded-none',
              'font-body font-light text-[10px] tracking-[0.28em] uppercase',
              'transition-all duration-200',
              isActive(href)
                ? 'bg-sage/12 text-sage-light border-l-[2px] border-sage pl-[10px]'
                : 'text-offwhite/35 hover:text-offwhite/70 hover:bg-offwhite/4 border-l-[2px] border-transparent pl-[10px]'
            )}
          >
            <span className="text-[13px] leading-none shrink-0">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge && <PendingBadge />}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-offwhite/6">
        <button
          onClick={() => startTransition(() => logoutAction())}
          disabled={pending}
          className="w-full text-left px-3 py-[10px] font-body font-light text-[9px] tracking-[0.28em] uppercase text-offwhite/22 hover:text-offwhite/55 transition-colors duration-200 disabled:opacity-40"
        >
          {pending ? 'Saindo…' : '→ Sair'}
        </button>
      </div>
    </aside>
  )
}

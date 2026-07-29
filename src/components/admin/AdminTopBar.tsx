'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/app/admin/actions'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export interface PendingItem {
  id: string
  referenceCode: string
  clientName: string
  serviceName: string
  date?: string
  startTime?: string
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8c-2 0-3.5 1.6-3.5 3.6v2c0 .5-.2 1-.6 1.4L3 9.9c-.4.4-.1 1.1.5 1.1h9c.6 0 .9-.7.5-1.1l-.9-1.1c-.4-.4-.6-.9-.6-1.4v-2c0-2-1.5-3.6-3.5-3.6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M6.3 12.4c.3.7 1 1.1 1.7 1.1s1.4-.4 1.7-1.1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

export function AdminTopBar({
  staffName,
  isOwner,
  pending,
}: {
  staffName: string
  isOwner: boolean
  pending: PendingItem[]
}) {
  const [pending_, startTransition] = useTransition()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const initial = staffName.trim().charAt(0).toUpperCase() || 'A'

  return (
    <header className="hidden lg:flex items-center justify-end h-[56px] px-6 border-b border-offwhite/[0.06] bg-charcoal-mid shrink-0">
      {/* Right cluster */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(o => !o); setProfileOpen(false) }}
            aria-label="Notificações"
            className="relative w-[36px] h-[36px] flex items-center justify-center text-offwhite/40 hover:bg-offwhite/5 hover:text-gold/80 transition-all duration-200"
          >
            <BellIcon />
            {pending.length > 0 && (
              <span className="absolute -top-[5px] -right-[5px] min-w-[16px] h-[16px] px-[3px] flex items-center justify-center bg-gold/20 border border-gold/40 text-gold/90 font-data text-[8px] leading-none">
                {pending.length > 9 ? '9+' : pending.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[280px] bg-charcoal border border-offwhite/[0.14] py-2">
              <p className="px-4 pb-2 font-body font-light text-[8px] tracking-[0.3em] uppercase text-offwhite/30 border-b border-offwhite/[0.06]">
                Agendamentos pendentes
              </p>
              {pending.length === 0 ? (
                <p className="px-4 py-4 font-body font-light text-[11px] text-offwhite/35 italic">Nada pendente por aqui.</p>
              ) : (
                <div className="max-h-[280px] overflow-y-auto">
                  {pending.map(p => (
                    <Link
                      key={p.id}
                      href={p.date ? `/admin/agenda?view=day&date=${p.date}` : '/admin/agenda'}
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-[10px] hover:bg-offwhite/5 transition-colors border-b border-offwhite/4 last:border-0"
                    >
                      <p className="font-body font-light text-[11px] text-offwhite/80 truncate">{p.clientName}</p>
                      <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.08em] mt-[2px]">
                        {p.serviceName}
                        {p.date && p.startTime && (
                          <> · {format(parseISO(p.date), "d MMM", { locale: ptBR })} às {p.startTime}</>
                        )}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/admin/agenda"
                onClick={() => setNotifOpen(false)}
                className="block px-4 pt-2 mt-1 border-t border-offwhite/[0.06] font-body font-light text-[8.5px] tracking-[0.25em] uppercase text-gold/70 hover:text-gold transition-colors"
              >
                Ver agenda →
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(o => !o); setNotifOpen(false) }}
            className="flex items-center gap-2 pl-[3px] pr-2 h-[36px] hover:bg-offwhite/5 transition-all duration-200"
          >
            <span className="w-[28px] h-[28px] flex items-center justify-center bg-gold/15 text-gold font-body font-light text-[11px]">
              {initial}
            </span>
            <span className="font-body font-light text-[10px] text-offwhite/60 max-w-[110px] truncate">{staffName}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[200px] bg-charcoal border border-offwhite/[0.14] py-1">
              <div className="px-4 py-3 border-b border-offwhite/[0.06]">
                <p className="font-body font-light text-[11px] text-offwhite/80 truncate">{staffName}</p>
                <p className="font-body font-light text-[8px] tracking-[0.25em] uppercase text-offwhite/30 mt-[2px]">
                  {isOwner ? 'Dono' : 'Equipe'}
                </p>
              </div>
              {isOwner && (
                <Link
                  href="/admin/configuracoes"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-[9px] font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/55 hover:bg-offwhite/5 hover:text-offwhite transition-colors"
                >
                  Configurações
                </Link>
              )}
              <button
                disabled={pending_}
                onClick={() => startTransition(() => logoutAction())}
                className={cn(
                  'w-full text-left px-4 py-[9px] font-body font-light text-[9px] tracking-[0.2em] uppercase',
                  'text-offwhite/40 hover:bg-offwhite/5 hover:text-offwhite transition-colors disabled:opacity-40'
                )}
              >
                {pending_ ? 'Saindo…' : '→ Sair'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ClientListItem {
  id: string
  name: string
  whatsapp: string
  email: string | null
  vip: boolean
  created_at: string
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9.8" y1="9.8" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** A client's row-level avatar — same treatment as the staff avatar in AdminTopBar, applied here for visual parity. */
function ClientAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span className="w-[30px] h-[30px] shrink-0 flex items-center justify-center bg-gold/15 border border-gold/25 text-gold font-body font-light text-[12px]">
      {initial}
    </span>
  )
}

export function ClientListFilter({ clients }: { clients: ClientListItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.whatsapp.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  }, [clients, query])

  return (
    <div>
      <div className="relative mb-5 max-w-[360px]">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-offwhite/30">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou e-mail…"
          className="w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg pl-[36px] pr-3 py-[10px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/25"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-10 text-center">
          <p className="font-display font-light text-[20px] text-offwhite/[0.18] italic">
            {query ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="bg-offwhite/5 border border-offwhite/[0.07] divide-y divide-offwhite/6">
          {filtered.map(c => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-offwhite/5 transition-colors duration-150 group"
            >
              <ClientAvatar name={c.name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-[2px]">
                  <p className="font-body font-light text-[13px] text-offwhite group-hover:text-offwhite truncate">
                    {c.name}
                  </p>
                  {c.vip && (
                    <span className="font-body font-light text-[7px] tracking-[0.3em] uppercase px-[7px] py-[2px] bg-gold/10 border border-gold/25 text-gold/60 shrink-0">
                      VIP
                    </span>
                  )}
                </div>
                <p className="font-body font-light text-[9px] text-offwhite/30 tracking-[0.12em]">
                  {c.whatsapp}{c.email ? ` · ${c.email}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body font-light text-[8.5px] text-offwhite/[0.22] tracking-[0.12em]">
                  desde {format(new Date(c.created_at), 'MMM yyyy', { locale: ptBR })}
                </p>
              </div>
              <span className="text-offwhite/[0.18] group-hover:text-offwhite/45 transition-colors text-[12px]">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

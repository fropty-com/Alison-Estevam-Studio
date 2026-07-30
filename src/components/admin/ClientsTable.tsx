'use client'

import { useMemo, useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toggleClientVip } from '@/app/admin/actions'
import { cn } from '@/lib/utils'
import { ClientDetailDrawer } from './ClientDetailDrawer'

export interface ClientRow {
  id: string
  name: string
  whatsapp: string
  email: string | null
  birthDate: string | null
  vip: boolean
  createdAt: string
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="9.8" y1="9.8" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function ClientAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span className="w-[28px] h-[28px] shrink-0 flex items-center justify-center bg-gold/15 border border-gold/25 text-gold font-body font-light text-[11px]">
      {initial}
    </span>
  )
}

function VipToggle({ id, vip }: { id: string; vip: boolean }) {
  const [checked, setChecked] = useState(vip)
  const [pending, startTransition] = useTransition()

  const toggle = () => {
    const next = !checked
    setChecked(next)
    startTransition(async () => {
      const res = await toggleClientVip(id, next)
      if (res?.error) setChecked(!next)
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={pending}
      onClick={toggle}
      className={cn(
        'relative w-[34px] h-[20px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50',
        checked ? 'bg-gold/40' : 'bg-offwhite/15'
      )}
    >
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full transition-all duration-200',
          checked ? 'left-[17px] bg-gold' : 'left-[3px] bg-offwhite/60'
        )}
      />
    </button>
  )
}

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

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
        <div className="overflow-x-auto border border-offwhite/[0.07]">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-offwhite/5 border-b border-offwhite/[0.07]">
                {['Nome completo', 'Telefone', 'Data de nasc.', 'E-mail', 'VIP', 'Cliente desde', ''].map(h => (
                  <th key={h} className="px-4 py-3 font-body font-light text-[8px] tracking-[0.18em] uppercase text-offwhite/35 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-offwhite/[0.05] last:border-b-0 hover:bg-offwhite/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ClientAvatar name={c.name} />
                      <span className="font-body font-light text-[12.5px] text-offwhite truncate">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-data text-[11.5px] text-offwhite/60 whitespace-nowrap">{c.whatsapp}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-body font-light text-[11px] text-offwhite/45 whitespace-nowrap">
                      {c.birthDate ? format(parseISO(c.birthDate), 'd MMM', { locale: ptBR }) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-body font-light text-[11px] text-offwhite/45 truncate">{c.email ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <VipToggle id={c.id} vip={c.vip} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-body font-light text-[10.5px] text-offwhite/30 whitespace-nowrap">
                      {format(parseISO(c.createdAt), 'MMM yyyy', { locale: ptBR })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setOpenId(c.id)}
                      className="px-3 py-[6px] font-body font-light text-[8px] tracking-[0.24em] uppercase text-offwhite/35 border border-offwhite/[0.12] hover:border-gold/35 hover:text-gold/[0.75] transition-all duration-200"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientDetailDrawer clientId={openId} onClose={() => setOpenId(null)} />
    </div>
  )
}

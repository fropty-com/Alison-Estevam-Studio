'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface Toast { id: number; name: string; service: string }

export function PendingBadge() {
  const [count,  setCount]  = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const addToast = (t: Omit<Toast, 'id'>) => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, ...t }])
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000)
  }

  useEffect(() => {
    // Initial count
    fetch('/api/admin/pending-count')
      .then(r => r.json())
      .then(d => setCount(d.count ?? 0))
      .catch(() => {})

    // Realtime subscription
    const supabase = createClient()
    const channel  = supabase
      .channel('appointments-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        async (payload) => {
          setCount(prev => prev + 1)

          // Fetch client + service names for the toast
          try {
            const res  = await supabase
              .from('appointments')
              .select('clients(name), services(name)')
              .eq('id', (payload.new as { id: string }).id)
              .single()
            const data = res.data as { clients: any; services: any } | null

            if (data) {
              const cli = Array.isArray(data.clients) ? data.clients[0] : data.clients
              const svc = Array.isArray(data.services) ? data.services[0] : data.services
              addToast({ name: cli?.name ?? 'Cliente', service: svc?.name ?? 'Serviço' })
            }
          } catch {}
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments' },
        () => {
          // Refresh count on any status change
          fetch('/api/admin/pending-count')
            .then(r => r.json())
            .then(d => setCount(d.count ?? 0))
            .catch(() => {})
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <>
      {/* Badge */}
      {count > 0 && (
        <span className={cn(
          'inline-flex items-center justify-center',
          'min-w-[18px] h-[18px] px-[5px]',
          'bg-gold/20 border border-gold/35 text-gold/80',
          'font-data text-[9px] leading-none rounded-none',
          'ml-auto shrink-0'
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="bg-charcoal-mid border border-offwhite/10 shadow-2xl px-5 py-4 max-w-[280px] animate-in slide-in-from-right-4 fade-in duration-300"
          >
            <p className="font-body font-light text-[8px] tracking-[0.35em] uppercase text-sage-light/70 mb-1">
              Novo agendamento
            </p>
            <p className="font-body font-light text-[13px] text-offwhite">{t.name}</p>
            <p className="font-body font-light text-[9px] text-offwhite/35 tracking-[0.12em] mt-[2px]">{t.service}</p>
          </div>
        ))}
      </div>
    </>
  )
}

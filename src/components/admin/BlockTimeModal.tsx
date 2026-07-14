'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { blockTimeRange } from '@/app/admin/actions'

const inputCls = 'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]'

function hourOptions(startMin: number, endMin: number): string[] {
  const opts: string[] = []
  for (let m = startMin; m <= endMin; m += 60) {
    opts.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:00`)
  }
  return opts
}

export function BlockTimeModal({
  date,
  gridStartMin,
  gridEndMin,
  onClose,
}: {
  date: string
  gridStartMin: number
  gridEndMin: number
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const allOptions = hourOptions(gridStartMin, gridEndMin)
  const startOptions = allOptions.slice(0, -1)
  const endOptions = allOptions.slice(1)

  const [start, setStart] = useState(startOptions[0] ?? '')
  const [end, setEnd] = useState(endOptions[endOptions.length - 1] ?? '')
  const [reason, setReason] = useState('')

  const canSubmit = !!start && !!end && start < end

  const submit = (confirmed?: boolean) => {
    setError(null)
    startTransition(async () => {
      const res = await blockTimeRange(date, start, end, reason || undefined, confirmed)
      if (res.needsConfirm) {
        const ok = window.confirm(
          `Há ${res.count} agendamento(s) nesse período. Eles não serão cancelados, mas o horário ficará bloqueado. Continuar?`
        )
        if (ok) submit(true)
        return
      }
      if (res.error) { setError(res.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-charcoal-deep/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-[380px] bg-charcoal border border-offwhite/14 p-6">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 border border-offwhite/18 text-offwhite/45 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
        >
          ✕
        </button>

        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">Agenda</p>
        <h2 className="font-display font-light text-[20px] text-offwhite tracking-[0.02em] mb-5">Bloquear horário</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={labelCls}>Início</label>
            <select value={start} onChange={e => setStart(e.target.value)} className={inputCls}>
              {startOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fim</label>
            <select value={end} onChange={e => setEnd(e.target.value)} className={inputCls}>
              {endOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className={labelCls}>Motivo (opcional)</label>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ex: almoço"
            className={inputCls}
          />
        </div>

        {error && (
          <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70 mb-3">{error}</p>
        )}
        {!canSubmit && (
          <p className="font-body font-light text-[9px] tracking-[0.1em] text-offwhite/30 mb-3">
            A hora de início deve ser antes da hora de fim.
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit || pending}
          onClick={() => submit()}
          className="w-full px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {pending ? 'Bloqueando…' : 'Bloquear horário'}
        </button>
      </div>
    </div>
  )
}

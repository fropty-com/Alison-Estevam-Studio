'use client'

import { useState, useTransition } from 'react'
import { updateLoyaltySettings } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function LoyaltySettingsForm({ settings }: {
  settings: { visits_required: number; reward_description: string }
}) {
  const [pending, startTransition] = useTransition()
  const [editing, setEditing]   = useState(false)
  const [visits,  setVisits]    = useState(String(settings.visits_required))
  const [reward,  setReward]    = useState(settings.reward_description)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  const handleSave = () => {
    setFeedback(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await updateLoyaltySettings({
        visits_required: parseInt(visits, 10),
        reward_description: reward.trim(),
      })
      if (res?.error) setFeedback(res.error)
      else { setSuccess(true); setEditing(false) }
    })
  }

  const inputCls = 'bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors'

  return (
    <div className="bg-offwhite/3 border border-offwhite/7 p-6">
      {!editing ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-body font-light text-[12px] text-offwhite/75">
              A cada <span className="font-data text-offwhite">{settings.visits_required}</span> atendimentos concluídos, o cliente ganha:
            </p>
            <p className="font-body font-light text-[13px] text-gold mt-1">{settings.reward_description}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="font-body font-light text-[8px] tracking-[0.28em] uppercase text-offwhite/25 hover:text-offwhite/55 transition-colors px-2 py-1 border border-transparent hover:border-offwhite/12 shrink-0"
          >
            Editar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]">
              Visitas necessárias
            </label>
            <input
              type="number"
              min="1"
              value={visits}
              onChange={e => setVisits(e.target.value)}
              className={cn(inputCls, 'w-full')}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]">
              Recompensa
            </label>
            <input
              type="text"
              value={reward}
              onChange={e => setReward(e.target.value)}
              placeholder="Ex: Um atendimento grátis"
              className={cn(inputCls, 'w-full')}
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button
              disabled={pending}
              onClick={handleSave}
              className="px-6 py-[10px] font-body font-light text-[9px] tracking-[0.35em] uppercase bg-offwhite/8 border border-offwhite/14 text-offwhite/60 hover:bg-sage/12 hover:border-sage/30 hover:text-sage-light transition-all duration-200 disabled:opacity-40"
            >
              {pending ? 'Salvando…' : 'Salvar'}
            </button>
            <button
              onClick={() => { setEditing(false); setVisits(String(settings.visits_required)); setReward(settings.reward_description) }}
              className="font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/25 hover:text-offwhite/50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {success && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light mt-3">Programa atualizado.</p>}
      {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70 mt-3">{feedback}</p>}
    </div>
  )
}

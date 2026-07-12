'use client'

import { useState, useTransition } from 'react'
import { updateAccountDetails } from '@/app/perfil/actions'

export function AccountForm({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const handleSave = () => {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateAccountDetails({ name, email })
      if (res?.error) setFeedback({ type: 'error', text: res.error })
      else setFeedback({ type: 'ok', text: 'Salvo.' })
    })
  }

  const inputCls = 'w-full bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-sm px-[15px] py-[12px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none placeholder:text-offwhite/35'

  return (
    <div className="mb-[10px]">
      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.28em] uppercase text-offwhite/40 mb-[6px]">Nome</label>
        <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
      </div>
      <div className="mb-[13px]">
        <label className="block font-body font-light text-xs tracking-[0.28em] uppercase text-offwhite/40 mb-[6px]">
          E-mail <span className="text-offwhite/20">(opcional)</span>
        </label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inputCls} />
      </div>

      {feedback && (
        <p className={`font-body font-light text-[10px] tracking-[0.1em] mb-[10px] ${feedback.type === 'error' ? 'text-error/70' : 'text-sage-light'}`}>
          {feedback.text}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={pending}
        className="w-full py-[14px] font-body font-medium text-[9.5px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep hover:bg-gold-light transition-all duration-300 disabled:opacity-50"
      >
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </div>
  )
}

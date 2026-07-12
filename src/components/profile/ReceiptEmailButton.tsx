'use client'

import { useState, useTransition } from 'react'
import { sendReceiptByEmail } from '@/app/perfil/actions'

export function ReceiptEmailButton({ paymentId, hasEmail }: { paymentId: string; hasEmail: boolean }) {
  const [asking, setAsking] = useState(false)
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const send = (toEmail: string) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await sendReceiptByEmail({ paymentId, email: toEmail })
      if (res?.error) setFeedback({ type: 'error', text: res.error })
      else { setFeedback({ type: 'ok', text: 'Recibo enviado por e-mail.' }); setAsking(false) }
    })
  }

  if (feedback?.type === 'ok') {
    return <p className="w-full text-center font-body font-light text-[11px] text-sage-light py-4">{feedback.text}</p>
  }

  if (asking || !hasEmail) {
    return (
      <div>
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full mb-[10px] bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-sm px-[15px] py-[12px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none placeholder:text-offwhite/35"
        />
        {feedback?.type === 'error' && <p className="font-body font-light text-[10px] text-error/70 mb-[10px]">{feedback.text}</p>}
        <button
          disabled={pending || !email.trim()}
          onClick={() => send(email)}
          className="w-full py-[14px] font-body font-medium text-[9.5px] tracking-[0.35em] uppercase border border-gold/50 text-gold hover:bg-gold/10 transition-all duration-300 disabled:opacity-40"
        >
          {pending ? 'Enviando…' : 'Enviar recibo'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setAsking(true)}
      className="w-full py-[14px] font-body font-medium text-[9.5px] tracking-[0.35em] uppercase border border-gold/50 text-gold hover:bg-gold/10 transition-all duration-300"
    >
      Me envie um recibo por e-mail
    </button>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { submitReview } from '@/app/perfil/actions'

export function ReviewForm({ appointmentId, serviceName }: { appointmentId: string; serviceName: string }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="border border-sage/20 bg-sage/[0.04] px-5 py-4">
        <p className="font-body font-light text-[12px] text-sage-light">Obrigado pela sua avaliação!</p>
      </div>
    )
  }

  const handleSubmit = () => {
    setError(null)
    if (rating === 0) { setError('Escolha uma nota.'); return }
    startTransition(async () => {
      const res = await submitReview({ appointmentId, rating, comment })
      if (res?.error) setError(res.error)
      else setDone(true)
    })
  }

  return (
    <div className="border border-offwhite/8 px-5 py-4">
      <p className="font-body font-light text-[12px] text-offwhite/65 mb-[10px]">{serviceName}</p>
      <div className="flex gap-[6px] mb-[12px]">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            className={cn('text-[22px] leading-none transition-colors', n <= rating ? 'text-gold' : 'text-offwhite/15')}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
        placeholder="Conte como foi (opcional)"
        className="w-full mb-[10px] bg-charcoal-mid border border-offwhite/20 text-offwhite font-body font-light text-[12px] px-[13px] py-[10px] outline-none focus:border-gold focus:bg-gold/5 transition-all duration-250 rounded-none resize-none placeholder:text-offwhite/30"
      />
      {error && <p className="font-body font-light text-[10px] text-error/70 mb-[10px]">{error}</p>}
      <button
        disabled={pending}
        onClick={handleSubmit}
        className="w-full py-[11px] font-body font-medium text-[8.5px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep hover:bg-gold-light transition-all duration-300 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Enviar avaliação'}
      </button>
    </div>
  )
}

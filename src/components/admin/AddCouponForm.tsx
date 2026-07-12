'use client'

import { useState, useTransition } from 'react'
import { addCoupon } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function AddCouponForm() {
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)
  const [type,      setType]        = useState<'percentage' | 'fixed'>('percentage')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set('discount_type', type)
    startTransition(async () => {
      const res = await addCoupon(fd)
      if (res?.error) setFeedback(res.error)
      else { setSuccess(true); (e.target as HTMLFormElement).reset(); setType('percentage') }
    })
  }

  const inputCls = 'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors placeholder:text-offwhite/18'
  const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]'

  return (
    <div className="bg-offwhite/3 border border-offwhite/7 p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-4">
        Criar cupom
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>Código</label>
          <input type="text" name="code" required placeholder="Ex: BEMVINDO10" className={cn(inputCls, 'uppercase')} />
        </div>
        <div>
          <label className={labelCls}>Tipo</label>
          <div className="flex gap-[4px]">
            <button
              type="button"
              onClick={() => setType('percentage')}
              className={cn(
                'flex-1 px-2 py-[9px] font-body font-light text-[10px] border transition-all duration-200',
                type === 'percentage' ? 'border-gold bg-gold/15 text-gold' : 'border-offwhite/12 text-offwhite/40 hover:border-offwhite/25'
              )}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => setType('fixed')}
              className={cn(
                'flex-1 px-2 py-[9px] font-body font-light text-[10px] border transition-all duration-200',
                type === 'fixed' ? 'border-gold bg-gold/15 text-gold' : 'border-offwhite/12 text-offwhite/40 hover:border-offwhite/25'
              )}
            >
              R$
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Valor</label>
          <input type="number" name="discount_value" required min="0.01" step="0.01" placeholder={type === 'percentage' ? '10' : '20'} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Limite de usos</label>
          <input type="number" name="max_uses" min="1" placeholder="Sem limite" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Validade</label>
          <input type="date" name="expires_at" className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-4 flex items-center gap-3 mt-1">
          <button
            type="submit"
            disabled={pending}
            className={cn(
              'px-6 py-[10px] font-body font-light text-[9px] tracking-[0.35em] uppercase',
              'bg-offwhite/8 border border-offwhite/14 text-offwhite/60',
              'hover:bg-sage/12 hover:border-sage/30 hover:text-sage-light',
              'transition-all duration-200 disabled:opacity-40'
            )}
          >
            {pending ? 'Criando…' : 'Criar cupom'}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">Cupom criado.</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}

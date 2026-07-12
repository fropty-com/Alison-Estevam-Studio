'use client'

import { useState, useTransition } from 'react'
import { addStaffMember } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function AddStaffMemberForm() {
  const [pending,  startTransition] = useTransition()
  const [feedback, setFeedback]     = useState<string | null>(null)
  const [success,  setSuccess]      = useState(false)
  const [role,     setRole]         = useState<'staff' | 'owner'>('staff')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    setSuccess(false)
    const fd = new FormData(e.currentTarget)
    fd.set('role', role)
    startTransition(async () => {
      const res = await addStaffMember(fd)
      if (res?.error) setFeedback(res.error)
      else { setSuccess(true); (e.target as HTMLFormElement).reset(); setRole('staff') }
    })
  }

  const inputCls = 'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-body font-light text-[12px] px-3 py-[9px] outline-none rounded-none focus:border-sage/50 transition-colors placeholder:text-offwhite/18'
  const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/28 mb-[5px]'

  return (
    <div className="bg-offwhite/3 border border-offwhite/7 p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-4">
        Adicionar à equipe
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nome</label>
          <input type="text" name="name" required placeholder="Nome completo" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
          <input type="email" name="email" required placeholder="email@exemplo.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Senha inicial</label>
          <input type="password" name="password" required minLength={8} placeholder="Mínimo 8 caracteres" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Papel</label>
          <div className="flex gap-[6px]">
            <button
              type="button"
              onClick={() => setRole('staff')}
              className={cn(
                'flex-1 px-3 py-[9px] font-body font-light text-[10px] tracking-[0.12em] border transition-all duration-200',
                role === 'staff' ? 'border-offwhite/40 text-offwhite/80 bg-offwhite/5' : 'border-offwhite/12 text-offwhite/40 hover:border-offwhite/25'
              )}
            >
              Funcionário
            </button>
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={cn(
                'flex-1 px-3 py-[9px] font-body font-light text-[10px] tracking-[0.12em] border transition-all duration-200',
                role === 'owner' ? 'border-gold bg-gold/15 text-gold' : 'border-offwhite/12 text-offwhite/40 hover:border-offwhite/25'
              )}
            >
              Dono
            </button>
          </div>
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
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
            {pending ? 'Adicionando…' : 'Adicionar membro'}
          </button>
          {success  && <p className="font-body font-light text-[9px] tracking-[0.2em] text-sage-light">Membro adicionado.</p>}
          {feedback && <p className="font-body font-light text-[9px] tracking-[0.2em] text-error/70">{feedback}</p>}
        </div>
      </form>
    </div>
  )
}

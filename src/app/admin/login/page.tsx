'use client'

import { useState, useTransition } from 'react'
import { loginAction } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const [error,   setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="font-body font-light text-[8.5px] tracking-[0.5em] uppercase text-offwhite/28 mb-2">
            Alison Estevam Studio
          </p>
          <h1 className="font-display font-light text-[32px] text-offwhite tracking-[0.05em]">
            Área Restrita
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-[13px]">
          <div>
            <label className="block font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/32 mb-[6px]" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className={cn(
                'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-display text-lg',
                'px-[15px] py-[13px] outline-none rounded-none',
                'focus:border-sage focus:bg-sage/5 transition-all duration-250',
                'placeholder:text-offwhite/18 placeholder:text-sm placeholder:font-body placeholder:font-light'
              )}
            />
          </div>

          <div>
            <label className="block font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/32 mb-[6px]" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={cn(
                'w-full bg-offwhite/3 border border-offwhite/9 text-offwhite font-display text-lg',
                'px-[15px] py-[13px] outline-none rounded-none',
                'focus:border-sage focus:bg-sage/5 transition-all duration-250'
              )}
            />
          </div>

          {error && (
            <p className="font-body font-light text-[9px] tracking-[0.18em] text-error/75 pt-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={cn(
              'w-full mt-2 py-[15px]',
              'font-body font-light text-[9px] tracking-[0.38em] uppercase',
              'bg-offwhite text-charcoal transition-all duration-300',
              'hover:bg-sage hover:text-offwhite',
              'disabled:opacity-45 disabled:cursor-not-allowed'
            )}
          >
            {pending ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

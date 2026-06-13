'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'cadastro'

interface Props {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')

  // Login state
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')

  // Cadastro extra fields
  const [name,     setName]     = useState('')
  const [phone,    setPhone]    = useState('')
  const [confirm,  setConfirm]  = useState('')

  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)

  useEffect(() => {
    if (!open) return
    setError(null)
    setDone(false)
  }, [open, mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setDone(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'cadastro') {
      if (pass !== confirm) { setError('As senhas não coincidem.'); return }
      if (pass.length < 6)  { setError('A senha deve ter no mínimo 6 caracteres.'); return }
    }

    setLoading(true)
    try {
      const supabase = createClient()

      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (err) {
          setError('E-mail ou senha incorretos.')
        } else {
          onClose()
          router.refresh()
        }
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: name, phone } },
        })
        if (err) {
          setError(err.message === 'User already registered'
            ? 'Este e-mail já está cadastrado.'
            : 'Erro ao criar conta. Tente novamente.')
        } else {
          setDone(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Entrar na conta' : 'Criar conta'}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal-deep/85 backdrop-blur-[12px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-[400px] bg-charcoal-mid border border-offwhite/8 px-10 py-10 shadow-[0_32px_80px_rgba(0,0,0,0.55)]">

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-offwhite/30 hover:text-offwhite/65 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {done ? (
          /* Success state — cadastro */
          <div className="text-center py-4">
            <div className="w-8 h-px bg-gold/40 mx-auto mb-7" aria-hidden="true" />
            <h2 className="font-display font-light text-3xl text-offwhite tracking-[0.03em] mb-3">
              Conta criada
            </h2>
            <p className="font-body font-light text-sm text-offwhite/45 leading-[1.9] mb-7">
              Verifique seu e-mail para confirmar o cadastro.
            </p>
            <button
              onClick={() => switchMode('login')}
              className="font-body font-light text-xs tracking-[0.35em] uppercase text-sage hover:text-sage-light transition-colors"
            >
              Ir para o login →
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-7">
              <p className="font-body font-light text-xs tracking-[0.45em] uppercase text-sage mb-2">
                Área do Cliente
              </p>
              <h2 className="font-display font-light text-3xl text-offwhite tracking-[0.03em]">
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>

              {mode === 'cadastro' && (
                <>
                  <Field id="am-name" label="Nome completo" type="text" autoComplete="name"
                    value={name} onChange={setName} placeholder="Seu nome" />
                  <Field id="am-phone" label="WhatsApp / Telefone" type="tel" autoComplete="tel"
                    value={phone} onChange={setPhone} placeholder="(11) 99999-9999" />
                </>
              )}

              <Field id="am-email" label="E-mail" type="email" autoComplete="email"
                value={email} onChange={setEmail} placeholder="seu@email.com" />

              <Field id="am-pass" label="Senha" type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={pass} onChange={setPass}
                placeholder={mode === 'login' ? '••••••••' : 'Mínimo 6 caracteres'} />

              {mode === 'cadastro' && (
                <Field id="am-confirm" label="Confirmar senha" type="password" autoComplete="new-password"
                  value={confirm} onChange={setConfirm} placeholder="Repita a senha" />
              )}

              {error && (
                <p className="font-body font-light text-xs tracking-[0.1em] text-red-400/80">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'mt-1 w-full py-[13px]',
                  'font-body font-light text-xs tracking-[0.4em] uppercase',
                  'text-charcoal-deep bg-gold',
                  'transition-all duration-300 hover:bg-gold-light hover:-translate-y-px',
                  'disabled:opacity-50 disabled:translate-y-0'
                )}
              >
                {loading
                  ? (mode === 'login' ? 'Entrando…' : 'Criando conta…')
                  : (mode === 'login' ? 'Entrar' : 'Criar conta')}
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-6 flex justify-center">
              {mode === 'login' ? (
                <button
                  onClick={() => switchMode('cadastro')}
                  className="font-body font-light text-xs tracking-[0.2em] uppercase text-offwhite/28 hover:text-offwhite/55 transition-colors"
                >
                  Não tem conta? Cadastre-se
                </button>
              ) : (
                <button
                  onClick={() => switchMode('login')}
                  className="font-body font-light text-xs tracking-[0.2em] uppercase text-offwhite/28 hover:text-offwhite/55 transition-colors"
                >
                  Já tem conta? Entrar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  type: string
  autoComplete: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}

function Field({ id, label, type, autoComplete, value, onChange, placeholder }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-body font-light text-xs tracking-[0.28em] uppercase text-offwhite/35 mb-[7px]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full bg-offwhite/4 border border-offwhite/10 px-4 py-[11px]',
          'font-body font-light text-sm text-offwhite placeholder:text-offwhite/20',
          'transition-colors duration-200 focus:outline-none focus:border-sage/55 focus:bg-offwhite/6'
        )}
      />
    </div>
  )
}

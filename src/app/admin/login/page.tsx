'use client'

import { useState, useTransition } from 'react'
import { loginAction, checkStaffPhoneAction, verifyStaffPhoneLoginAction } from '@/app/admin/actions'
import { sendOtpAction } from '@/app/entrar/actions'
import { cn, maskPhoneInput } from '@/lib/utils'

type Method = 'email' | 'phone'
type PhoneStep = 'phone' | 'code'

const inputCls = 'w-full bg-charcoal-mid border border-offwhite/20 text-offwhite font-display text-lg px-[15px] py-[13px] outline-none rounded-none focus:border-gold focus:bg-gold/5 transition-all duration-250 placeholder:text-offwhite/55 placeholder:text-sm placeholder:font-body placeholder:font-light'
const labelCls = 'block font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]'
const buttonCls = 'w-full mt-2 py-[15px] font-body font-medium text-[9px] tracking-[0.38em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-45 disabled:cursor-not-allowed'
const tabCls = (active: boolean) => cn(
  'flex-1 pb-[10px] font-body font-light text-[9px] tracking-[0.3em] uppercase transition-colors duration-250 relative',
  'after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:h-px after:bg-gold after:transition-[width] after:duration-300',
  active ? 'text-offwhite after:w-full' : 'text-offwhite/55 hover:text-offwhite/70 after:w-0'
)

export default function LoginPage() {
  const [method, setMethod] = useState<Method>('email')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // E-mail
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Phone
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)

  const switchMethod = (m: Method) => {
    setMethod(m)
    setError(null)
  }

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginAction(fd)
      if (result?.error) setError(result.error)
    })
  }

  const handleSendCode = () => {
    setError(null)
    if (phone.replace(/\D/g, '').length !== 11) { setError('Informe um telefone válido (DDD + 9 dígitos).'); return }
    startTransition(async () => {
      const check = await checkStaffPhoneAction(phone)
      if (check.error) { setError(check.error); return }
      const res = await sendOtpAction(phone)
      if (res.error) { setError(res.error); return }
      setDevCode(res.devCode ?? null)
      setPhoneStep('code')
    })
  }

  const handleVerifyCode = () => {
    setError(null)
    if (code.trim().length < 4) { setError('Informe o código recebido.'); return }
    startTransition(async () => {
      const res = await verifyStaffPhoneLoginAction({ phoneRaw: phone, code })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="min-h-screen bg-charcoal flex flex-col items-center px-4 pt-[12vh] pb-16">
      <div className="w-full max-w-[380px]">
        {/* Brand */}
        <div className="mb-10 text-center">
          <p className="font-body font-light text-[8.5px] tracking-[0.5em] uppercase text-offwhite/55 mb-2">
            Alison Estevam Studio
          </p>
          <h1 className="font-display font-light text-[32px] text-offwhite tracking-[0.05em]">
            Área Restrita
          </h1>
        </div>

        {/* Method tabs */}
        <div className="flex gap-6 mb-8 border-b border-offwhite/[0.08]">
          <button type="button" onClick={() => switchMethod('email')} className={tabCls(method === 'email')}>
            E-mail
          </button>
          <button type="button" onClick={() => switchMethod('phone')} className={tabCls(method === 'phone')}>
            Telefone
          </button>
        </div>

        {method === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-[13px]">
            <div>
              <label className={labelCls} htmlFor="email">E-mail</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls} htmlFor="password">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="font-body font-light text-[9px] tracking-[0.18em] text-error/75 pt-1">{error}</p>
            )}

            <button type="submit" disabled={pending} className={buttonCls}>
              {pending ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <div className="space-y-[13px]">
            {phoneStep === 'phone' ? (
              <>
                <div>
                  <label className={labelCls} htmlFor="phone">WhatsApp / Telefone</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={phone}
                    onChange={e => setPhone(maskPhoneInput(e.target.value))}
                    className={inputCls}
                  />
                </div>

                {error && (
                  <p className="font-body font-light text-[9px] tracking-[0.18em] text-error/75 pt-1">{error}</p>
                )}

                <button type="button" onClick={handleSendCode} disabled={pending} className={buttonCls}>
                  {pending ? 'Aguarde…' : 'Enviar código'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setPhoneStep('phone'); setCode(''); setError(null); setDevCode(null) }}
                  className="mb-[6px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/55 hover:text-offwhite/60 transition-colors"
                >
                  ← Trocar número
                </button>

                <p className="font-body font-light text-[12px] text-offwhite/55 mb-[13px]">
                  Enviamos um código de 6 dígitos para {phone}.
                </p>

                {devCode && (
                  <div className="mb-[16px] px-[15px] py-[12px] border border-gold/30 bg-gold/5">
                    <p className="font-body font-light text-[9px] tracking-[0.18em] uppercase text-gold/80 mb-1">
                      Modo desenvolvimento
                    </p>
                    <p className="font-data text-lg text-gold">{devCode}</p>
                  </div>
                )}

                <div>
                  <label className={labelCls} htmlFor="code">Código</label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {error && (
                  <p className="font-body font-light text-[9px] tracking-[0.18em] text-error/75 pt-1">{error}</p>
                )}

                <button type="button" onClick={handleVerifyCode} disabled={pending} className={buttonCls}>
                  {pending ? 'Entrando…' : 'Entrar'}
                </button>

                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={pending}
                  className="w-full mt-[14px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/55 hover:text-offwhite/60 transition-colors"
                >
                  Reenviar código
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

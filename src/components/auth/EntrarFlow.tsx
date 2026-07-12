'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn, maskPhoneInput } from '@/lib/utils'
import { checkPhoneAction, sendOtpAction, verifyAndLoginAction } from '@/app/entrar/actions'

type Step = 'phone' | 'code'

const inputCls = (hasError: boolean) => cn(
  'w-full bg-charcoal-mid border text-offwhite font-body font-light text-sm px-[15px] py-[12px]',
  'outline-none transition-all duration-250 rounded-none',
  'placeholder:text-offwhite/35 placeholder:font-body placeholder:font-light',
  hasError ? 'border-error/55' : 'border-offwhite/20 focus:border-gold focus:bg-gold/5',
)

const labelCls = 'block font-body font-light text-xs tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]'

export function EntrarFlow() {
  const [step, setStep] = useState<Step>('phone')
  const [pending, startTransition] = useTransition()

  const [phone, setPhone] = useState('')
  const [isNew, setIsNew] = useState(false)
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState('')
  const [consentWhatsapp, setConsentWhatsapp] = useState(true)
  const [consentTerms, setConsentTerms] = useState(false)

  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheckPhone = () => {
    setError(null)
    if (phone.replace(/\D/g, '').length !== 11) { setError('Informe um telefone válido (DDD + 9 dígitos).'); return }
    startTransition(async () => {
      const res = await checkPhoneAction(phone)
      if (res.error) { setError(res.error); return }
      setIsNew(!res.exists)
      setChecked(true)
      if (res.exists) sendCode()
    })
  }

  const sendCode = () => {
    startTransition(async () => {
      const res = await sendOtpAction(phone)
      if (res.error) { setError(res.error); return }
      setDevCode(res.devCode ?? null)
      setStep('code')
    })
  }

  const handleContinueNew = () => {
    setError(null)
    if (name.trim().length < 2) { setError('Informe seu nome.'); return }
    if (!consentTerms) { setError('É necessário aceitar os termos para continuar.'); return }
    sendCode()
  }

  const handleVerify = () => {
    setError(null)
    if (code.trim().length < 4) { setError('Informe o código recebido.'); return }
    startTransition(async () => {
      const res = await verifyAndLoginAction({
        phoneRaw: phone,
        code,
        name: isNew ? name : undefined,
        consentWhatsapp: isNew ? consentWhatsapp : undefined,
        consentTerms: isNew ? consentTerms : undefined,
      })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="px-8 pt-9 pb-16">
      {step === 'phone' ? (
        <Link href="/" className="mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors inline-block">
          ← Voltar ao início
        </Link>
      ) : (
        <button
          onClick={() => { setStep('phone'); setChecked(false); setCode(''); setError(null) }}
          className="mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
        >
          ← Trocar número
        </button>
      )}

      <div className="mb-[22px]">
        <p className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/28 mb-[6px]">
          Área do Cliente
        </p>
        <h2 className="font-display font-light text-[26px] text-offwhite tracking-[0.02em] leading-[1.15] mb-[6px]">
          {step === 'phone' ? 'Entrar' : 'Confirme o código'}
        </h2>
        <p className="font-body font-light text-[12px] text-offwhite/40">
          {step === 'phone'
            ? 'Informe seu telefone para entrar ou criar sua conta.'
            : `Enviamos um código de 6 dígitos para ${phone}.`}
        </p>
      </div>

      <div className="mt-[26px]">
        {step === 'phone' && (
          <div>
            <div className="mb-[13px]">
              <label className={labelCls} htmlFor="ef-phone">WhatsApp / Telefone</label>
              <input
                id="ef-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                maxLength={15}
                value={phone}
                onChange={e => { setPhone(maskPhoneInput(e.target.value)); setChecked(false) }}
                disabled={checked}
                className={inputCls(false)}
              />
            </div>

            {checked && isNew && (
              <>
                <div className="mb-[13px]">
                  <label className={labelCls} htmlFor="ef-name">Seu nome</label>
                  <input
                    id="ef-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Como você se chama?"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputCls(false)}
                  />
                </div>

                <label className="flex items-start gap-[10px] mb-[10px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentWhatsapp}
                    onChange={e => setConsentWhatsapp(e.target.checked)}
                    className="mt-[3px] accent-gold"
                  />
                  <span className="font-body font-light text-[11px] text-offwhite/50 leading-[1.5]">
                    Aceito receber confirmações e lembretes de agendamento por WhatsApp.
                  </span>
                </label>

                <label className="flex items-start gap-[10px] mb-[18px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentTerms}
                    onChange={e => setConsentTerms(e.target.checked)}
                    className="mt-[3px] accent-gold"
                  />
                  <span className="font-body font-light text-[11px] text-offwhite/50 leading-[1.5]">
                    Li e aceito os{' '}
                    <Link href="/termos" target="_blank" className="text-gold/80 hover:text-gold underline underline-offset-2">
                      termos de uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacidade" target="_blank" className="text-gold/80 hover:text-gold underline underline-offset-2">
                      política de privacidade
                    </Link>.
                  </span>
                </label>
              </>
            )}

            {error && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mb-[13px]">{error}</p>}

            <button
              onClick={checked && isNew ? handleContinueNew : handleCheckPhone}
              disabled={pending}
              className="w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-50"
            >
              {pending ? 'Aguarde…' : (checked && isNew) ? 'Enviar código' : 'Continuar'}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div>
            {devCode && (
              <div className="mb-[16px] px-[15px] py-[12px] border border-gold/30 bg-gold/5">
                <p className="font-body font-light text-[9px] tracking-[0.18em] uppercase text-gold/80 mb-1">
                  Modo desenvolvimento
                </p>
                <p className="font-data text-lg text-gold">{devCode}</p>
              </div>
            )}

            <div className="mb-[13px]">
              <label className={labelCls} htmlFor="ef-code">Código</label>
              <input
                id="ef-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={e => setCode(e.target.value)}
                className={inputCls(false)}
              />
            </div>

            {error && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/65 mb-[13px]">{error}</p>}

            <button
              onClick={handleVerify}
              disabled={pending}
              className="w-full py-[16px] font-body font-medium text-[9.5px] tracking-[0.38em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-50"
            >
              {pending ? 'Entrando…' : 'Entrar'}
            </button>

            <button
              onClick={sendCode}
              disabled={pending}
              className="w-full mt-[14px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors"
            >
              Reenviar código
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAccountDetails, uploadClientAvatar, removeClientAvatar } from '@/app/perfil/actions'
import { maskPhoneInput } from '@/lib/utils'

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/[0.18]'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/[0.28] mb-[5px]'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'C'
}

export function EditClientProfileForm({
  initialName,
  initialPhone,
  initialEmail,
  initialAvatarUrl,
}: {
  initialName: string
  initialPhone: string
  initialEmail: string
  initialAvatarUrl: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = name.trim().split(/\s+/).filter(Boolean).length >= 2

  const handleSave = () => {
    if (!canSubmit) return
    setError(null)
    startTransition(async () => {
      const res = await updateAccountDetails({ name, phone, email })
      if (res?.error) setError(res.error)
      else router.refresh()
    })
  }

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato inválido. Envie uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      setError('Imagem muito grande. Envie um arquivo de até 3MB.')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.set('file', file)
      const res = await uploadClientAvatar(formData)
      if (res?.error) { setError(res.error); return }
      setAvatarUrl(res.avatarUrl ?? null)
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setError(null)
    startTransition(async () => {
      const res = await removeClientAvatar()
      if (res?.error) { setError(res.error); return }
      setAvatarUrl(null)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Avatar — square, matching the site's geometric edges (not the rounded staff-portal look) */}
      <div className="flex items-center gap-5 mb-7">
        <div className="w-[72px] h-[72px] bg-offwhite/5 border border-offwhite/10 flex items-center justify-center shrink-0 overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-display font-light text-[26px] text-gold/70">{initials(name)}</span>
          )}
        </div>
        <div className="flex flex-col gap-[6px]">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleAvatarChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={handleAvatarPick}
            className="px-4 py-[9px] font-body font-medium text-[8px] tracking-[0.28em] uppercase bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-all duration-200 disabled:opacity-40"
          >
            {uploading ? 'Enviando…' : 'Alterar foto'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              disabled={pending || uploading}
              onClick={handleRemoveAvatar}
              className="px-4 py-[7px] font-body font-light text-[8px] tracking-[0.25em] uppercase text-offwhite/30 hover:text-error/70 transition-colors disabled:opacity-40"
            >
              Remover foto
            </button>
          )}
        </div>
      </div>

      {/* Name / phone / email */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="col-span-2">
          <label className={labelCls}>Nome completo</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome e sobrenome" className={inputCls} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(maskPhoneInput(e.target.value))}
            placeholder="(00) 00000-0000"
            className={inputCls}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls}>E-mail (opcional)</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className={inputCls}
          />
        </div>
      </div>

      {error && (
        <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70 mb-3">{error}</p>
      )}

      <button
        type="button"
        disabled={!canSubmit || pending}
        onClick={handleSave}
        className="px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </div>
  )
}

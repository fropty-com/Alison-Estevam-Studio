'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateStaffProfile, updateStaffAvatar } from '@/app/admin/actions'
import { cn, maskPhoneInput, isFullName } from '@/lib/utils'
import { AvatarCropModal } from '@/components/ui/AvatarCropModal'

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55'
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'

const MAX_AVATAR_BYTES = 3 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'A'
}

export function EditStaffProfileForm({
  userId,
  initialName,
  initialPhone,
  initialEmail,
  initialBirthDate,
  initialAvatarUrl,
}: {
  userId: string
  initialName: string
  initialPhone: string
  initialEmail: string
  initialBirthDate: string
  initialAvatarUrl: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [birthDate, setBirthDate] = useState(initialBirthDate)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSubmit = isFullName(name) && email.trim().length > 0

  const handleSave = () => {
    if (!canSubmit) return
    setError(null)
    startTransition(async () => {
      const res = await updateStaffProfile({ name, phone: phone || undefined, email, birthDate: birthDate || undefined })
      if (res?.error) setError(res.error)
      else router.refresh()
    })
  }

  const handleAvatarPick = () => fileInputRef.current?.click()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato inválido. Envie uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Imagem muito grande. Envie um arquivo de até 3MB.')
      return
    }

    setError(null)
    setCropFile(file)
  }

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null)
    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const folder = `staff/${userId}`
      const path = `${folder}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/jpeg',
      })
      if (uploadError) {
        setError('Erro ao enviar a foto.')
        return
      }

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const res = await updateStaffAvatar(publicUrlData.publicUrl)
      if (res?.error) {
        setError(res.error)
        return
      }
      setAvatarUrl(publicUrlData.publicUrl)
      await removeOtherAvatarFiles(folder, path)
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setError(null)
    startTransition(async () => {
      const res = await updateStaffAvatar(null)
      if (res?.error) { setError(res.error); return }
      setAvatarUrl(null)
      await removeOtherAvatarFiles(`staff/${userId}`, null)
      router.refresh()
    })
  }

  // Every upload uses a fresh filename (timestamped), so old photos never
  // get overwritten — without this, they'd pile up in the bucket forever.
  const removeOtherAvatarFiles = async (folder: string, keepPath: string | null) => {
    const supabase = createClient()
    const { data: files } = await supabase.storage.from('avatars').list(folder)
    const toRemove = (files ?? [])
      .map(f => `${folder}/${f.name}`)
      .filter(p => p !== keepPath)
    if (toRemove.length > 0) await supabase.storage.from('avatars').remove(toRemove)
  }

  return (
    <div>
      {/* Avatar */}
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
              className="px-4 py-[7px] font-body font-light text-[8px] tracking-[0.25em] uppercase text-offwhite/55 hover:text-error/70 transition-colors disabled:opacity-40"
            >
              Remover foto
            </button>
          )}
        </div>
      </div>

      {/* Name / phone / email / birth date */}
      <div className="mb-4">
        <div className="mb-3">
          <label className={labelCls}>Nome completo</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome e sobrenome" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[2fr_3fr] gap-2 mb-3">
          <div className="min-w-0">
            <label className={labelCls}>WhatsApp (opcional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(maskPhoneInput(e.target.value))}
              placeholder="(00) 00000-0000"
              className={inputCls}
            />
          </div>
          <div className="min-w-0">
            <label className={labelCls}>Data de nascimento (opcional)</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>E-mail</label>
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
        className={cn(
          'px-6 py-[11px] font-body font-medium text-[9px] tracking-[0.35em] uppercase',
          'bg-gold text-charcoal-deep transition-all duration-300',
          'hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed',
        )}
      >
        {pending ? 'Salvando…' : 'Salvar alterações'}
      </button>

      {cropFile && (
        <AvatarCropModal file={cropFile} onCancel={() => setCropFile(null)} onConfirm={handleCropConfirm} />
      )}
    </div>
  )
}

'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createProduct, updateProduct } from '@/app/admin/actions'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { useModalA11y } from '@/lib/hooks/useModalA11y'

const inputCls = 'w-full bg-offwhite/5 border border-offwhite/[0.09] text-offwhite font-body font-light text-lg px-3 py-[9px] outline-none rounded-none focus:border-gold/50 transition-colors placeholder:text-offwhite/55'
const selectCls = `${inputCls} appearance-none pr-8`
const labelCls = 'block font-body font-light text-[7.5px] tracking-[0.3em] uppercase text-offwhite/55 mb-[5px]'
const optionStyle = { backgroundColor: 'rgb(var(--c-charcoal))', color: 'rgb(var(--c-offwhite))' }

const MAX_PHOTO_BYTES = 3 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export interface ProductFormValues {
  id: string
  name: string
  category: string
  description: string
  price: number
  compare_at_price: number | null
  stock_quantity: number
  image_url: string | null
}

export function ProductFormModal({ product, onClose }: { product?: ProductFormValues; onClose: () => void }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useModalA11y(onClose)

  const isEditing = !!product

  const handlePhotoPick = () => fileInputRef.current?.click()

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato inválido. Envie uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Imagem muito grande. Envie um arquivo de até 3MB.')
      return
    }

    setError(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const path = `products/${Date.now()}.${file.name.split('.').pop() || 'jpg'}`
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (uploadError) { setError('Erro ao enviar a foto.'); return }

      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(path)
      setImageUrl(publicUrlData.publicUrl)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('image_url', imageUrl ?? '')
    startTransition(async () => {
      const res = isEditing ? await updateProduct(product.id, fd) : await createProduct(fd)
      if (res?.error) { setError(res.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-charcoal-deep/60"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={t.products.eyebrow} tabIndex={-1} className="relative w-full max-w-[440px] bg-charcoal border border-offwhite/[0.14] p-6 max-h-[90vh] overflow-y-auto outline-none">
        <button
          onClick={onClose}
          aria-label={t.agenda.close}
          className="absolute top-5 right-5 w-[36px] h-[36px] border border-offwhite/[0.18] text-offwhite/55 text-[12px] flex items-center justify-center transition-colors hover:border-offwhite/40 hover:text-offwhite"
        >
          ✕
        </button>

        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/55 mb-1">{t.products.eyebrow}</p>
        <h2 className="font-display font-light text-[20px] text-offwhite tracking-[0.02em] mb-5">
          {isEditing ? t.products.form.editTitle : t.products.form.newTitle}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-[64px] h-[80px] shrink-0 bg-offwhite/5 border border-offwhite/10 overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="font-body font-light text-[9px] text-offwhite/55">—</span>
              )}
            </div>
            <div>
              <label className={labelCls}>{t.products.form.photo}</label>
              <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handlePhotoChange} className="hidden" />
              <button
                type="button"
                disabled={uploading}
                onClick={handlePhotoPick}
                className="px-4 py-[9px] font-body font-medium text-[8px] tracking-[0.28em] uppercase bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25 transition-all duration-200 disabled:opacity-40"
              >
                {uploading ? t.products.form.uploading : t.products.form.changePhoto}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t.products.form.name}</label>
            <input type="text" name="name" defaultValue={product?.name} placeholder={t.products.form.namePlaceholder} className={inputCls} required />
          </div>

          <div>
            <label className={labelCls}>{t.products.form.category}</label>
            <div className="relative">
              <select name="category" defaultValue={product?.category ?? 'shampoo'} className={selectCls} required>
                {(['shampoo', 'condicionador', 'pomada', 'locao', 'pente'] as const).map(c => (
                  <option key={c} value={c} style={optionStyle}>{t.products.categories[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>{t.products.form.description}</label>
            <input type="text" name="description" defaultValue={product?.description} placeholder={t.products.form.descriptionPlaceholder} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t.products.form.price}</label>
              <input type="number" name="price" step="0.01" min="0.01" defaultValue={product?.price} placeholder={t.products.form.pricePlaceholder} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>{t.products.form.compareAtPrice}</label>
              <input type="number" name="compare_at_price" step="0.01" min="0" defaultValue={product?.compare_at_price ?? ''} placeholder={t.products.form.compareAtPricePlaceholder} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t.products.form.stockQuantity}</label>
            <input type="number" name="stock_quantity" step="1" min="0" defaultValue={product?.stock_quantity ?? 0} className={inputCls} required />
          </div>

          {error && (
            <p className="font-body font-light text-[9px] tracking-[0.15em] text-error/70">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-[11px] font-body font-light text-[9px] tracking-[0.3em] uppercase border border-offwhite/10 text-offwhite/55 hover:text-offwhite/70 transition-colors"
            >
              {t.products.form.cancel}
            </button>
            <button
              type="submit"
              disabled={pending || uploading}
              className="flex-1 px-4 py-[11px] font-body font-medium text-[9px] tracking-[0.3em] uppercase bg-gold text-charcoal-deep transition-all duration-300 hover:bg-gold-light disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isEditing
                ? (pending ? t.products.form.saving : t.products.form.save)
                : (pending ? t.products.form.creating : t.products.form.create)}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/LanguageProvider'
import { logoutClientAction } from '@/app/conta/actions'
import { cn } from '@/lib/utils'

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'C'
}

export function ClientProfileMenu({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 pl-[3px] pr-2 h-[36px] hover:bg-offwhite/5 transition-all duration-200"
      >
        <span className="w-[28px] h-[28px] shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-gold/15 text-gold font-body font-light text-[11px]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : initials(name)}
        </span>
        <span className="font-body font-light text-[10px] text-offwhite/60 max-w-[110px] truncate">{name}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-[180px] bg-charcoal border border-offwhite/[0.14] py-1">
          <div className="px-4 py-3 border-b border-offwhite/[0.06]">
            <p className="font-body font-light text-[11px] text-offwhite/80 truncate">{name}</p>
            <p className="font-body font-light text-[8px] tracking-[0.25em] uppercase text-offwhite/30 mt-[2px]">
              {t.client.role}
            </p>
          </div>
          <Link
            href="/perfil"
            onClick={() => setOpen(false)}
            className="block px-4 py-[9px] font-body font-light text-[9px] tracking-[0.2em] uppercase text-offwhite/55 hover:bg-offwhite/5 hover:text-offwhite transition-colors"
          >
            {t.topbar.myProfile}
          </Link>
          <button
            disabled={pending}
            onClick={() => startTransition(() => logoutClientAction())}
            className={cn(
              'w-full text-left px-4 py-[9px] font-body font-light text-[9px] tracking-[0.2em] uppercase',
              'text-offwhite/40 hover:bg-offwhite/5 hover:text-offwhite transition-colors disabled:opacity-40'
            )}
          >
            {pending ? t.topbar.signingOut : t.topbar.signOut}
          </button>
        </div>
      )}
    </div>
  )
}

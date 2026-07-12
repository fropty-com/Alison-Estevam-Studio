'use client'

import { useState, useTransition } from 'react'
import { requestAccountDeletion } from '@/app/perfil/actions'

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-body font-light text-[10px] tracking-[0.2em] uppercase text-error/50 hover:text-error/75 transition-colors"
      >
        Solicitar exclusão da conta
      </button>
    )
  }

  return (
    <div className="border border-error/25 bg-error/[0.04] px-6 py-5">
      <p className="font-body font-light text-[9px] tracking-[0.22em] uppercase text-error/70 mb-[8px]">
        Excluir sua conta
      </p>
      <p className="font-body font-light text-[12px] text-offwhite/50 leading-[1.7] mb-[16px]">
        Seus dados pessoais (nome, telefone, e-mail) serão removidos. O histórico de atendimentos é mantido de
        forma anônima, conforme nossa política de retenção. Essa ação não pode ser desfeita e você será
        desconectado imediatamente.
      </p>
      {error && <p className="font-body font-light text-[10px] text-error/70 mb-[12px]">{error}</p>}
      <div className="flex gap-[10px]">
        <button
          disabled={pending}
          onClick={() => startTransition(async () => {
            const res = await requestAccountDeletion()
            if (res?.error) setError(res.error)
          })}
          className="flex-1 py-[12px] font-body font-light text-[8.5px] tracking-[0.24em] uppercase bg-error/15 border border-error/35 text-error/85 hover:bg-error/25 transition-all duration-200 disabled:opacity-50"
        >
          {pending ? 'Processando…' : 'Confirmar exclusão'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-[12px] font-body font-light text-[8.5px] tracking-[0.24em] uppercase border border-offwhite/12 text-offwhite/40 hover:text-offwhite/65 transition-all duration-200"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { updateStaffRole, removeStaffMember } from '@/app/admin/actions'
import { cn } from '@/lib/utils'

export function StaffMemberRow({ member, isSelf }: {
  member: { id: string; name: string; role: 'owner' | 'staff' }
  isSelf: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const act = (fn: () => Promise<{ ok?: boolean; error?: string } | undefined>) => {
    startTransition(async () => {
      const res = await fn()
      if (res?.error) setFeedback(res.error)
      else { setFeedback(null); setConfirmRemove(false) }
    })
  }

  const isOwner = member.role === 'owner'

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-4">
        <span className="font-body font-light text-[12px] text-offwhite/70 flex-1">
          {member.name}
          {isSelf && <span className="text-offwhite/25"> (você)</span>}
        </span>

        <button
          disabled={pending}
          onClick={() => act(() => updateStaffRole(member.id, isOwner ? 'staff' : 'owner'))}
          className={cn(
            'px-3 py-[6px] font-body font-light text-[8px] tracking-[0.22em] uppercase border transition-all duration-200 disabled:opacity-40',
            isOwner
              ? 'bg-gold/12 border-gold/30 text-gold hover:bg-gold/20'
              : 'border-offwhite/12 text-offwhite/45 hover:border-offwhite/25'
          )}
        >
          {isOwner ? 'Dono' : 'Funcionário'}
        </button>

        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            className="font-body font-light text-[8px] tracking-[0.22em] uppercase text-error/45 hover:text-error/70 transition-colors px-2 py-1 border border-transparent hover:border-error/20"
          >
            Remover
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              disabled={pending}
              onClick={() => act(() => removeStaffMember(member.id))}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase bg-error/12 border border-error/25 text-error/70 hover:bg-error/20 transition-all disabled:opacity-40"
            >
              {pending ? '…' : 'Confirmar'}
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="px-2 py-1 font-body font-light text-[8px] tracking-[0.22em] uppercase border border-offwhite/10 text-offwhite/25 hover:text-offwhite/50 transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {feedback && <p className="font-body font-light text-[8.5px] tracking-[0.18em] text-error/70 mt-2">{feedback}</p>}
    </div>
  )
}

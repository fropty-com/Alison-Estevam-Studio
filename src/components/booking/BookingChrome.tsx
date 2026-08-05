import Link from 'next/link'
import { Skeleton } from '@/components/ui/Skeleton'

/** Matches the prototype's per-step "← ..." back link exactly — used on every booking-flow screen. */
export function BackLink({ children, ...props }: { children: React.ReactNode; href?: string; onClick?: () => void }) {
  const cls = 'mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/55 hover:text-offwhite/60 transition-colors inline-block'
  if (props.href) {
    return <Link href={props.href} className={cls}>{children}</Link>
  }
  return <button onClick={props.onClick} className={cls}>{children}</button>
}

/** Eyebrow + title + subtitle — the header block every booking-flow screen opens with. */
export function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-[22px]">
      <p className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/55 mb-[6px]">
        {eyebrow}
      </p>
      <h2 className="font-display font-light text-[26px] text-offwhite tracking-[0.02em] leading-[1.15] mb-[6px]">
        {title}
      </h2>
      <p className="font-body font-light text-[12px] text-offwhite/55">
        {subtitle}
      </p>
    </div>
  )
}

/** The bordered, row-divided "review" card used for the booking summary — reused wherever appointment details need a read-only display. */
export function DetailCard({ rows, footer }: { rows: { label: React.ReactNode; value: React.ReactNode }[]; footer?: React.ReactNode }) {
  return (
    <div className="border border-offwhite/10 mb-[26px]">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start justify-between gap-3 px-[18px] py-[13px] border-b border-offwhite/[0.08]">
          <span className="font-body font-light text-[12px] text-offwhite/55">{row.label}</span>
          <span className="font-body font-light text-[12px] text-offwhite text-right">{row.value}</span>
        </div>
      ))}
      {footer && <div className="px-[18px] py-[13px]">{footer}</div>}
    </div>
  )
}

/** Placeholder rows matching the service/cuidado card shape — shown while the list is still loading, instead of a plain "Carregando…" line. */
export function ServiceListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-[10px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} aria-hidden="true" className="border border-offwhite/[0.14] px-[18px] py-[16px] flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-[18px] w-2/3" />
            <Skeleton className="h-[9px] w-1/3" />
          </div>
          <Skeleton className="h-[18px] w-14 shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** The bordered, centered "done" card shown after cancel/confirm/reschedule — title, custom content, then a link back to the account. */
export function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-offwhite/5 border border-offwhite/10 p-8 text-center">
      <p className="font-display font-light text-[22px] text-offwhite/60 italic mb-2">{title}</p>
      {children}
      <Link
        href="/conta"
        className="block mt-[16px] mx-auto bg-transparent border-none text-center font-body font-light text-[8.5px] tracking-[0.28em] uppercase text-offwhite/55 py-[6px] cursor-pointer hover:text-offwhite/85 transition-colors underline underline-offset-4 decoration-offwhite/10"
      >
        Voltar ao início
      </Link>
    </div>
  )
}

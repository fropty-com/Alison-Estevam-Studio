import Link from 'next/link'

/** Matches the prototype's per-step "← ..." back link exactly — used on every booking-flow screen. */
export function BackLink({ children, ...props }: { children: React.ReactNode; href?: string; onClick?: () => void }) {
  const cls = 'mb-[18px] font-body font-light text-[10px] tracking-[0.2em] uppercase text-offwhite/30 hover:text-offwhite/60 transition-colors inline-block'
  if (props.href) {
    return <Link href={props.href} className={cls}>{children}</Link>
  }
  return <button onClick={props.onClick} className={cls}>{children}</button>
}

/** Eyebrow + title + subtitle — the header block every booking-flow screen opens with. */
export function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-[22px]">
      <p className="font-body font-light text-[9px] tracking-[0.38em] uppercase text-offwhite/28 mb-[6px]">
        {eyebrow}
      </p>
      <h2 className="font-display font-light text-[26px] text-offwhite tracking-[0.02em] leading-[1.15] mb-[6px]">
        {title}
      </h2>
      <p className="font-body font-light text-[12px] text-offwhite/40">
        {subtitle}
      </p>
    </div>
  )
}

/** The bordered, row-divided "review" card used for the booking summary — reused wherever appointment details need a read-only display. */
export function DetailCard({ rows, footer }: { rows: { label: string; value: string }[]; footer?: React.ReactNode }) {
  return (
    <div className="border border-offwhite/10 mb-[26px]">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between px-[18px] py-[13px] border-b border-offwhite/8">
          <span className="font-body font-light text-[12px] text-offwhite/45">{label}</span>
          <span className="font-body font-light text-[12px] text-offwhite text-right">{value}</span>
        </div>
      ))}
      {footer && <div className="px-[18px] py-[13px]">{footer}</div>}
    </div>
  )
}

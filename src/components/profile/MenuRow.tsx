import Link from 'next/link'

export function MenuRow({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-6 py-5 hover:bg-offwhite/3 transition-colors"
    >
      <span className="font-body font-light text-[15px] text-offwhite/40 w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 font-body font-light text-[13px] text-offwhite/75">{label}</span>
      <span className="font-body font-light text-offwhite/25">→</span>
    </Link>
  )
}

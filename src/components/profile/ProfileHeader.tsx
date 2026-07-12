import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function ProfileHeader({ title, backHref = '/perfil' }: { title: string; backHref?: string }) {
  return (
    <div className="border-b border-offwhite/6">
      <div className="max-w-[560px] mx-auto flex items-center gap-4 px-8 py-7">
        <Link
          href={backHref}
          aria-label="Voltar"
          className="font-body font-light text-lg text-offwhite/40 hover:text-offwhite/70 transition-colors"
        >
          ←
        </Link>
        <h1 className="font-display font-light text-[19px] text-offwhite tracking-[0.02em] flex-1">{title}</h1>
        <ThemeToggle />
      </div>
    </div>
  )
}

import Link from 'next/link'
import type { Metadata } from 'next'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { BRAND } from '@/config/brand'

export const metadata: Metadata = { title: 'Sobre — Alison Estevam Studio' }

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-charcoal">
      <ProfileHeader title="Sobre" />

      <div className="max-w-[560px] mx-auto px-8 py-10">
        <div className="border border-offwhite/7 divide-y divide-offwhite/6">
          <a
            href={BRAND.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-6 py-5 hover:bg-offwhite/3 transition-colors"
          >
            <span className="font-body font-light text-[13px] text-offwhite/75">Site do {BRAND.name}</span>
            <span className="font-body font-light text-offwhite/25">→</span>
          </a>
          <Link href="/termos" className="flex items-center justify-between px-6 py-5 hover:bg-offwhite/3 transition-colors">
            <span className="font-body font-light text-[13px] text-offwhite/75">Termos de Serviço</span>
            <span className="font-body font-light text-offwhite/25">→</span>
          </Link>
          <Link href="/privacidade" className="flex items-center justify-between px-6 py-5 hover:bg-offwhite/3 transition-colors">
            <span className="font-body font-light text-[13px] text-offwhite/75">Política de Privacidade</span>
            <span className="font-body font-light text-offwhite/25">→</span>
          </Link>
          <Link href="/licencas" className="flex items-center justify-between px-6 py-5 hover:bg-offwhite/3 transition-colors">
            <span className="font-body font-light text-[13px] text-offwhite/75">Licenças</span>
            <span className="font-body font-light text-offwhite/25">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

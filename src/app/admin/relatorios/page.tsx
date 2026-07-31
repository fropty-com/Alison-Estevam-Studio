import Link from 'next/link'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'
import { getLocale } from '@/lib/i18n/getLocale'
import { getDictionary } from '@/lib/i18n/getDictionary'
import type { Dictionary } from '@/lib/i18n/dictionaries/pt'

export const dynamic = 'force-dynamic'

function SheetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="2.5" y1="7.5" x2="17.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7.5" y1="2.5" x2="7.5" y2="17.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 2.5h7l3 3v12H5v-15Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M12 2.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="7.5" y1="10.5" x2="12.5" y2="10.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <line x1="7.5" y1="13" x2="12.5" y2="13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}

function getReports(t: Dictionary) {
  return [
    { slug: 'faturamento', ...t.reports.list.faturamento },
    { slug: 'clientes', ...t.reports.list.clientes },
    { slug: 'agendamentos', ...t.reports.list.agendamentos },
    { slug: 'despesas', ...t.reports.list.despesas },
  ]
}

export default async function RelatoriosPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  const locale = await getLocale()
  const t = getDictionary(locale)
  const REPORTS = getReports(t)

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">{t.reports.eyebrow}</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">{t.reports.title}</h1>
        <p className="font-body font-light text-[11px] text-offwhite/35 tracking-[0.05em] mt-2 max-w-[520px]">
          {t.reports.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {REPORTS.map(r => (
          <div key={r.slug} className="bg-offwhite/5 border border-offwhite/[0.07] p-6 flex flex-col">
            <p className="font-display font-light text-[19px] text-offwhite mb-2">{r.title}</p>
            <p className="font-body font-light text-[11px] text-offwhite/40 leading-[1.6] mb-5 flex-1">
              {r.description}
            </p>
            <div className="flex gap-[10px]">
              <a
                href={`/api/admin/relatorios/${r.slug}/csv`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-[10px] font-body font-light text-[9px] tracking-[0.22em] uppercase border border-sage/30 text-sage-light hover:bg-sage/10 hover:border-sage/50 transition-all duration-200"
              >
                <SheetIcon />
                {t.reports.exportExcel}
              </a>
              <Link
                href={`/admin/relatorios/${r.slug}/imprimir`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-[10px] font-body font-light text-[9px] tracking-[0.22em] uppercase border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 transition-all duration-200"
              >
                <DocIcon />
                {t.reports.exportPdf}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

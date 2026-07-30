import Link from 'next/link'
import { RestrictedAccess } from '@/components/admin/RestrictedAccess'
import { getAdminRole } from '@/lib/admin-auth'

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

const REPORTS = [
  {
    slug: 'faturamento',
    title: 'Faturamento do mês',
    description: 'Todos os pagamentos recebidos este mês, com forma de pagamento, taxas e gorjetas.',
  },
  {
    slug: 'clientes',
    title: 'Clientes',
    description: 'Lista completa de clientes com total de visitas, ticket médio e última visita.',
  },
  {
    slug: 'agendamentos',
    title: 'Agendamentos do mês',
    description: 'Todos os agendamentos deste mês, com status, cliente, serviço e valor.',
  },
  {
    slug: 'despesas',
    title: 'Despesas',
    description: 'Histórico de despesas registradas, com categoria, vencimento e status de pagamento.',
  },
]

export default async function RelatoriosPage() {
  const role = await getAdminRole()
  if (role !== 'owner') return <RestrictedAccess />

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <p className="font-body font-light text-[8.5px] tracking-[0.45em] uppercase text-offwhite/[0.28] mb-1">Admin</p>
        <h1 className="font-display font-light text-[30px] text-offwhite tracking-[0.03em]">Relatórios</h1>
        <p className="font-body font-light text-[11px] text-offwhite/35 tracking-[0.05em] mt-2 max-w-[520px]">
          Exporte os dados do negócio em planilha (CSV, compatível com Excel) ou em PDF para impressão/arquivo.
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
                Exportar Excel
              </a>
              <Link
                href={`/admin/relatorios/${r.slug}/imprimir`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-[10px] font-body font-light text-[9px] tracking-[0.22em] uppercase border border-gold/30 text-gold hover:bg-gold/10 hover:border-gold/50 transition-all duration-200"
              >
                <DocIcon />
                Exportar PDF
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

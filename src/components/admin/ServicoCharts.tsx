'use client'

interface MonthPoint  { label: string; revenue: number }
interface CountPoint  { name: string; count: number }
interface StalePoint  { id: string; name: string; daysSince: number | null; neverUsed: boolean }
interface HourPoint   { name: string; perHour: number }
interface PairPoint   { pair: string; count: number }

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export function ServicoCharts({
  monthlyTrend,
  maisRealizados,
  menosRealizados,
  staleList,
  receitaPorHora,
  realizadosJuntos,
}: {
  monthlyTrend: MonthPoint[]
  maisRealizados: CountPoint[]
  menosRealizados: CountPoint[]
  staleList: StalePoint[]
  receitaPorHora: HourPoint[]
  realizadosJuntos: PairPoint[]
}) {
  const maxTrend = Math.max(...monthlyTrend.map(m => m.revenue), 1)
  const maxMais  = Math.max(...maisRealizados.map(s => s.count), 1)
  const maxMenos = Math.max(...menosRealizados.map(s => s.count), 1)
  const maxHour  = Math.max(...receitaPorHora.map(s => s.perHour), 1)
  const maxPair  = Math.max(...realizadosJuntos.map(p => p.count), 1)

  return (
    <div className="space-y-6">
      {/* Tendência de receita de serviços */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">
          Receita de serviços
        </p>
        <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-5">Últimos 6 meses</p>
        <div className="flex items-end gap-[10px] h-[140px]">
          {monthlyTrend.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <span className="font-body font-light text-[8px] text-offwhite/35 leading-none">
                {m.revenue > 0 ? fmt(m.revenue) : ''}
              </span>
              <div className="w-full relative" style={{ height: `${Math.max((m.revenue / maxTrend) * 100, 3)}%` }}>
                <div className={m.revenue > 0 ? 'w-full h-full bg-sage/45 border-t border-sage/60 transition-all duration-500' : 'w-full h-full bg-offwhite/5'} />
              </div>
              <span className="font-body font-light text-[8px] text-offwhite/25 tracking-[0.08em] capitalize">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mais realizados */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">Mais realizados — este mês</p>
          <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-6">Ranking por quantidade</p>
          {maisRealizados.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">Nenhum serviço realizado deste mês.</p>
          ) : (
            <div className="space-y-[12px]">
              {maisRealizados.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                    <span className="font-data text-[13px] text-offwhite/55">{s.count}×</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-sage/45 transition-all duration-500" style={{ width: `${(s.count / maxMais) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Menos realizados */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">Menos realizados no mês</p>
          <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-6">Serviços com menor procura</p>
          {menosRealizados.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">Nenhum serviço realizado deste mês.</p>
          ) : (
            <div className="space-y-[12px]">
              {menosRealizados.map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                    <span className="font-data text-[13px] text-offwhite/55">{s.count}×</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-error/40 transition-all duration-500" style={{ width: `${maxMenos > 0 ? (s.count / maxMenos) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Serviços parados */}
      <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
        <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">Serviços parados</p>
        <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-6">Sem realização há mais de 30 dias ou nunca realizados</p>
        {staleList.length === 0 ? (
          <p className="font-body font-light text-[12px] text-sage-light text-center py-6">Todos os serviços foram realizados recentemente.</p>
        ) : (
          <div className="divide-y divide-offwhite/6 -mx-6">
            {staleList.map(s => (
              <div key={s.id} className="flex items-center justify-between px-6 py-3">
                <span className="font-body font-light text-[12px] text-offwhite/70">{s.name}</span>
                <span className="font-body font-light text-[9px] text-error/60 tracking-[0.1em]">
                  {s.neverUsed ? 'Nunca realizado' : `${s.daysSince}d sem realização`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por hora */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">Receita por hora</p>
          <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-6">Eficiência: quanto cada serviço gera por hora de trabalho</p>
          {receitaPorHora.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">Cadastre duração nos serviços para ver a eficiência.</p>
          ) : (
            <div className="space-y-[12px]">
              {receitaPorHora.slice(0, 6).map((s, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{s.name}</span>
                    <span className="font-data text-[12px] text-offwhite/55">{fmt(s.perHour)}</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-gold/45 transition-all duration-500" style={{ width: `${(s.perHour / maxHour) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Realizados juntos */}
        <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
          <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">Realizados juntos</p>
          <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-6">Pares mais frequentes na mesma comanda</p>
          {realizadosJuntos.length === 0 ? (
            <p className="font-body font-light text-[11px] text-offwhite/[0.22] italic text-center py-6">Nenhum par de serviços encontrado.</p>
          ) : (
            <div className="space-y-[12px]">
              {realizadosJuntos.map((p, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-[5px]">
                    <span className="font-body font-light text-[11px] text-offwhite/70 truncate pr-3">{p.pair}</span>
                    <span className="font-data text-[13px] text-offwhite/55">{p.count}×</span>
                  </div>
                  <div className="w-full h-[3px] bg-offwhite/5">
                    <div className="h-full bg-sage/40 transition-all duration-500" style={{ width: `${(p.count / maxPair) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

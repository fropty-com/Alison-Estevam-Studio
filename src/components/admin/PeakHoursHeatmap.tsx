'use client'

interface Cell { weekday: number; hour: number; count: number }

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function PeakHoursHeatmap({ cells, hours }: { cells: Cell[]; hours: number[] }) {
  const maxCount = Math.max(...cells.map(c => c.count), 1)
  const byKey = new Map(cells.map(c => [`${c.weekday}-${c.hour}`, c.count]))

  return (
    <div className="bg-offwhite/5 border border-offwhite/[0.07] p-6">
      <p className="font-body font-light text-[8.5px] tracking-[0.38em] uppercase text-offwhite/35 mb-1">
        Horários de pico
      </p>
      <p className="font-body font-light text-[8px] text-offwhite/[0.22] tracking-[0.1em] mb-6">
        Mapa de calor dos agendamentos deste mês
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid gap-[3px] mb-[3px]" style={{ gridTemplateColumns: `40px repeat(${hours.length}, 1fr)` }}>
            <span />
            {hours.map(h => (
              <span key={h} className="text-center font-body font-light text-[8px] text-offwhite/30 tracking-[0.05em]">
                {String(h).padStart(2, '0')}h
              </span>
            ))}
          </div>

          {WEEKDAY_LABELS.map((label, weekday) => (
            <div key={weekday} className="grid gap-[3px] mb-[3px]" style={{ gridTemplateColumns: `40px repeat(${hours.length}, 1fr)` }}>
              <span className="flex items-center font-body font-light text-[9px] text-offwhite/35">{label}</span>
              {hours.map(h => {
                const count = byKey.get(`${weekday + 1}-${h}`) ?? 0
                const intensity = count / maxCount
                return (
                  <div
                    key={h}
                    title={`${label} ${h}h: ${count} agendamento${count !== 1 ? 's' : ''}`}
                    className="aspect-square rounded-none transition-all duration-300"
                    style={{
                      backgroundColor: count === 0
                        ? 'rgb(var(--c-offwhite) / 0.04)'
                        : `rgb(var(--c-gold) / ${(0.15 + intensity * 0.65).toFixed(2)})`,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
